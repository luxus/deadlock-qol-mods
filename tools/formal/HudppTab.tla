---- MODULE HudppTab ----
\* hookHudppTabs in lib/addon-settings/1.2.3 and 1.2.4 (addon_settings.js).
\* HUD++ showTab returns when the requested tab is already its closed-over tab
\* (improved-quickbuy 0e8c7ed). We never write HudppTab_*.

CONSTANT Fix

Tabs == {"hud", "mm", "xh"}

VARIABLES parked, ourShown, hudppRan

vars == <<parked, ourShown, hudppRan>>

Init ==
    /\ parked = "xh"
    /\ ourShown = FALSE
    /\ hudppRan = TRUE

\* showTab(r, TRUE): our tab is selected, HudppTab_* stays put.
OpenOurs ==
    /\ ourShown = FALSE
    /\ ourShown' = TRUE
    /\ hudppRan' = FALSE
    /\ UNCHANGED parked

\* The Activated handler. Fix is the parked === id branch that calls
\* activateHudpp(other) before activateHudpp(b).
Click(id) ==
    /\ ourShown
    /\ id \in Tabs
    /\ IF Fix /\ parked = id THEN
         /\ parked' = id
         /\ ourShown' = FALSE
         /\ hudppRan' = TRUE
       ELSE
         /\ ourShown' = FALSE
         /\ IF id = parked THEN
              /\ hudppRan' = FALSE
              /\ UNCHANGED parked
            ELSE
              /\ parked' = id
              /\ hudppRan' = TRUE

ClickHud == Click("hud")
ClickMm == Click("mm")
ClickXh == Click("xh")

Next == OpenOurs \/ ClickHud \/ ClickMm \/ ClickXh

\* A click while our tab is up must make HUD++ showTab run, not return at once.
TabClickRuns == ourShown \/ hudppRan

Spec == Init /\ [][Next]_vars
====
