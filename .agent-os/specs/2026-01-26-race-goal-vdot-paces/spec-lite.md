# Spec Summary (Lite)

Add mandatory race goal fields (distance dropdown + time target selector) to training plan upload form. Backend calculates VDOT from race goal using Daniels' formula and derives six training pace zones (Easy, Long Run, Marathon, Threshold, Interval, Repetition) stored in User document. AI recommendations prioritize plan-embedded paces but fall back to calculated paces when unavailable.
