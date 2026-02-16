The Battle Select page will have a layout as follows.

Large, bold text with "Today's Arena Boss Line-up" centered.

Then 4 boss tiles, one for each tier (Tier 1, Tier 2, Tier 3, Tier 4).  And underneath each boss tile, a Scout button.

Tier 1 tile:  Should have a 5-pixel border in color RGB (70, 180, 90) and looping video https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation1.webm
Tier 2 tile:  Should have a 5-pixel border in color RGB (167, 139, 253) and looping video https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation2.webm
Tier 3 tile:  Should have a 5-pixel border in color RGB (255, 155, 1) and looping video https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation3.webm
Tier 4 tile:  Should have a 5-pixel border in color RGB (230, 0, 38) and looping video https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation4.webm


Upon loading the page, perform the following:
- For each scouting button, look up the has_scouted value in the user_daily_boss_status table for this user.  If true, disable that scouting button and look up the scouting_success value.  If that is true, look up the daily_boss_lineup row for this tier to find the boss and look up the boss's details in the bosses_lookup table.  Display the boss name and image in the tile (instead of the looping video)
- For each boss tile, look up the has_fought value in the user_daily_status table for this user.  If true, disable the tile, replace the image with solid black background and display a large X in the tile.

If the user selects an active tile, perform the following:
- Check to see if the Scout button for that tier is enabled.  If so, display a Yes/No popup confirmation with "Are you sure you want to battle without scouting?"  If No is selected, the popup is closed and no further action.  If Yes is selected, bring up the Battle page detailed at instructions/battle.md passing in the boss tier.

If the user presses a Scout button, update the user_daily_boss_status by setting the has_scouted field to true for this user and tier.  Then bring up the Scout page for that tier.  The scout page is described in instructions/scouting.md
