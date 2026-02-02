The Battle Select page will have a layout as follows.

Large, bold text with "Today's Arena Boss Line-up" centered.

Then 4 boss tiles, one for each tier (Tier 1, Tier 2, Tier 3, Tier 4).  And underneath each boss tile, a Scout button.

Tier 1 tile:  Should have a 5-pixel border in color RGB (70, 180, 90)
Tier 2 tile:  Should have a 5-pixel border in color RGB (167, 139, 253)
Tier 3 tile:  Should have a 5-pixel border in color RGB (255, 155, 1)
Tier 4 tile:  Should have a 5-pixel border in color RGB (230, 0, 38)

Upon loading the page, perform the following:
- For each scouting button, look up the has_scouted value in the user_daily_boss_status table for this user.  If true, disable that scouting button.
- For each boss tile, look up the has_fought value in the user_daily_status table for this user.  If true, disable the tile and display a large X in the tile.

If the user selects an active tile, perform the following:
- Check to see if the Scout button for that tier is enabled.  If so, display a Yes/No popup confirmation with "Are you sure you want to battle without scouting?"  If No is selected, the popup is closed and no further action.  If Yes is selected, bring up the Battle page detailed at instructions/battle.md passing in the boss tier.

If the user presses a Scout button, bring up the Scout page for that tier (currently a placeholder).

