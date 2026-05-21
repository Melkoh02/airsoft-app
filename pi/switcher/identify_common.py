#!/usr/bin/env python3
"""Identify the COMMON terminal of a 3-position center-off switch using only the Pi.

Wiring for this test (start by guessing any wire as the common candidate):

    Switch common candidate -> GND       (header pin 9)
    Switch other wire #1    -> GPIO17    (header pin 11)
    Switch other wire #2    -> GPIO27    (header pin 13)

Run this script, then toggle the switch through all three positions.

Interpretation:
  - Both GPIOs respond, one per outer position, both HIGH in center
    -> Common candidate is correct. You are done.
  - Only ONE GPIO ever goes LOW (in only ONE switch position)
    -> The wire connected to the OTHER GPIO is the real common.
       Power off, swap that wire with the GND wire, run again.

Safety: this only uses GPIO inputs + GND with internal pull-ups, so current
is in the microamps. Do NOT connect switch wires to 5V (pins 2, 4) or
3V3 (pins 1, 17).
"""

from gpiozero import Button
from signal import pause

LEFT_GPIO = 17   # header pin 11
RIGHT_GPIO = 27  # header pin 13

left = Button(LEFT_GPIO, pull_up=True, bounce_time=0.05)
right = Button(RIGHT_GPIO, pull_up=True, bounce_time=0.05)


def render(_=None):
    l = left.is_pressed   # is_pressed == pin is LOW (pulled to GND through switch)
    r = right.is_pressed
    if l and not r:
        label = "GPIO17 LOW   -> position I  (will be Blue)"
    elif r and not l:
        label = "GPIO27 LOW   -> position II (will be Red)"
    elif not l and not r:
        label = "both HIGH    -> center O   (Neutral) OR common wire is wrong"
    else:
        label = "both LOW     -> unexpected, check wiring"
    print(label, flush=True)


left.when_pressed = render
left.when_released = render
right.when_pressed = render
right.when_released = render

print("Toggle the switch through all three positions. Ctrl-C to quit.")
print("Expected: 1 distinct LOW per outer position, both HIGH in center.\n")
render()
pause()
