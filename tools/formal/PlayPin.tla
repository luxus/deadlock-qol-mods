---- MODULE PlayPin ----
\* liftPins, pinBase, step, and watch in both addon_settings.js copies.
\* .CanChangeHero arrives after the ADDONS row is placed (improved-quickbuy
\* e17b680, lea 22.11). These libraries do not call syncPlay from step.

CONSTANT LookLifts

VARIABLES canChange, margin, looking, looked

vars == <<canChange, margin, looking, looked>>

Init ==
    /\ canChange = FALSE
    /\ margin = 312
    /\ looking = TRUE
    /\ looked = FALSE

\* The class lands. liftPins does not run inside this step.
ClassArrives ==
    /\ looking
    /\ canChange = FALSE
    /\ canChange' = TRUE
    /\ UNCHANGED <<margin, looking, looked>>

\* watch schedules step until M.built. LookLifts is syncPlay() at the end of step.
MenuLook ==
    /\ looking
    /\ IF LookLifts THEN margin' = IF canChange THEN 382 ELSE 312
       ELSE UNCHANGED margin
    /\ looked' = (canChange \/ looked)
    /\ UNCHANGED <<canChange, looking>>

\* openWindow calls liftPins. That is an ADDONS click, not the first Esc open.
OpenAddons ==
    /\ margin' = IF canChange THEN 382 ELSE 312
    /\ UNCHANGED <<canChange, looking, looked>>

\* step returns 0 once M.built, and watch sets H.done.
CompLockOpens ==
    /\ looking
    /\ looking' = FALSE
    /\ UNCHANGED <<canChange, margin, looked>>

Done == looking = FALSE /\ UNCHANGED vars

Next == ClassArrives \/ MenuLook \/ OpenAddons \/ CompLockOpens \/ Done

\* The next menu look after the class, with no ADDONS click, leaves PLAY at 382.
PlayGap == ~(canChange /\ looked /\ margin = 312)

Spec == Init /\ [][Next]_vars
====
