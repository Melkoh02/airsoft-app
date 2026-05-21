#!/usr/bin/env python3
"""Switcher daemon: reads a 3-position switch on GPIO17/GPIO27 and broadcasts
state changes over WebSocket on port 8765.

Wire protocol (NDJSON, one JSON object per WS message):
  {"v":1,"type":"hello","device":"switcher","fw":"1.0.0"}   (sent once on connect)
  {"v":1,"type":"state","value":"blue|red|neutral","at":<unixMs>}
"""

import asyncio
import json
import logging
import signal
import time

import websockets
from gpiozero import Button

LEFT_GPIO = 17
RIGHT_GPIO = 27
PORT = 8765
PROTOCOL_VERSION = 1
FW_VERSION = "1.0.0"
DEBOUNCE_S = 0.05

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("switcher")


def compute_state(left_pressed: bool, right_pressed: bool) -> str:
    if left_pressed and not right_pressed:
        return "blue"
    if right_pressed and not left_pressed:
        return "red"
    return "neutral"


def now_ms() -> int:
    return int(time.time() * 1000)


class SwitcherDaemon:
    def __init__(self) -> None:
        self.left = Button(LEFT_GPIO, pull_up=True, bounce_time=DEBOUNCE_S)
        self.right = Button(RIGHT_GPIO, pull_up=True, bounce_time=DEBOUNCE_S)
        self.clients: set[websockets.WebSocketServerProtocol] = set()
        self.state: str = compute_state(self.left.is_pressed, self.right.is_pressed)
        self.loop: asyncio.AbstractEventLoop | None = None

        for btn in (self.left, self.right):
            btn.when_pressed = self._on_gpio_change
            btn.when_released = self._on_gpio_change

    def _on_gpio_change(self) -> None:
        new_state = compute_state(self.left.is_pressed, self.right.is_pressed)
        if new_state == self.state:
            return
        self.state = new_state
        if self.loop is not None:
            self.loop.call_soon_threadsafe(
                lambda: asyncio.create_task(self._broadcast_state())
            )

    async def _broadcast_state(self) -> None:
        msg = json.dumps(
            {"v": PROTOCOL_VERSION, "type": "state", "value": self.state, "at": now_ms()}
        )
        log.info("state -> %s (clients=%d)", self.state, len(self.clients))
        for ws in list(self.clients):
            try:
                await ws.send(msg)
            except Exception:
                pass

    async def handler(self, ws) -> None:
        peer = ws.remote_address
        log.info("client connected: %s", peer)
        self.clients.add(ws)
        try:
            await ws.send(
                json.dumps(
                    {
                        "v": PROTOCOL_VERSION,
                        "type": "hello",
                        "device": "switcher",
                        "fw": FW_VERSION,
                    }
                )
            )
            await ws.send(
                json.dumps(
                    {
                        "v": PROTOCOL_VERSION,
                        "type": "state",
                        "value": self.state,
                        "at": now_ms(),
                    }
                )
            )
            async for _ in ws:
                pass
        except websockets.ConnectionClosed:
            pass
        finally:
            self.clients.discard(ws)
            log.info("client disconnected: %s", peer)

    async def run(self) -> None:
        self.loop = asyncio.get_running_loop()
        log.info("starting on 0.0.0.0:%d, initial state=%s", PORT, self.state)
        stop = self.loop.create_future()

        def _signal_handler() -> None:
            log.info("shutdown requested")
            if not stop.done():
                stop.set_result(None)

        for sig in (signal.SIGINT, signal.SIGTERM):
            self.loop.add_signal_handler(sig, _signal_handler)

        async with websockets.serve(
            self.handler, "0.0.0.0", PORT, ping_interval=20, ping_timeout=20
        ):
            await stop


def main() -> None:
    asyncio.run(SwitcherDaemon().run())


if __name__ == "__main__":
    main()
