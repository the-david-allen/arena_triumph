The Scouting page should be called with a corresponding tier (1, 2, 3 or 4) and will have a "Begin Scouting" button in the center.  

Underneath the button will be this text:  "Within the alloted time, determine which Weapon, Affinity, Number, and Armor belongs in each spot."

Once the Begin Scouting button is pressed, the game area will be revealed.  On the left will be a 4x4 grid ("main grid") with 16 cells each containing their own smaller 4x4 grid.  On the right will be the Clue area with the label "Clues" above and underneath will be several randomly generated clues.  Above the main grid and the Clue area there will be a "Timer" that starts at 2 minutes and counts down one second at a time.  Once it reaches zero EndScout is triggered (with a fail).

In the grid, the first row contains 4 Weapons grids.  Each Weapon grid is 4x4 and contains a Bow, a Staff, an Axe, and a Sword with images specified. The grid will only display the images.  The second row contains 4 Affinities grids, each a 4x4 with the 4 specified Affinities.  Again each cell should display only the image.  The third row contains 4 Dice grids, each with the dice specified.  The fourth row contains 4 Armor grids, each with the Armor specified.

Once the game is loaded, each cell in the main grid will be secretly assigned a value.  Cells in the top row will be assigned weapon values, and each of the 4 cells will have a value of a different one of the weapons (one cell in the top row will have the Bow, one the Staff, one the Axe, and one the Sword.  Which cell contains each is randomly selected).  In the same way, each of the cells in the 2nd row of the main grid will be randomly assigned a different Affinity.  Each cell in the 3rd row of the main grid will be randomly assigned a different dice value.  And each cell in the 4th row of the main grid will be randomly assigned a different armor.  

In the Clue area, different clues will be displayed giving hints to the player.  Clues should be displayed as shown in Images/clue_display.jpeg  Once the main grid values are assigned, use an algorithmic approach to display a small number of clues that will allow the values to be deduced by a human deterministically.

There are multiple clue types:
* Before: a weapon/affinity/dice/armor followed by an arrow pointing right followed by another weapon/affinity/dice/armor (this indicates the left item is assigned to a column of the main grid that is to the left of the column that the right item is assigned to)
* Adjacent: a weapon/affinity/dice/armor followed by a bi-directional right/left arrow followed by another weapon/affinity/dice/armor (indicating the left item and right item are in adjacent columns in the main grid - they can still be in different rows and must be in different but adjacent columns)
* hTrio: an item followed by another item followed by another item.  With a right arrow above and left arrow beneath.  This clue indicates the first item is in an adjacent column to the second item which is in an adjacent column (in the same direction) to the third item.  So the first and third items should be 2 columns apart.
* vTrio: an item above a second item which is above a third item.  Indicating that all 3 items are in the same column with the top item in a row above the second item and the second item is in a row above the bottom item.
* Above: an item above a second item.  Indicating that both items are in the same column with the top item in a row higher than that of the bottom item.



When a user right clicks an item in a cell, if that item is the secret assigned item for that cell, EndScout is triggered with a fail.  Otherwise, that item image is removed from the grid.  If this results in only a single remaining item image in the inner 4x4 grid, enlarge that image to cover the full cell of the main grid (replacing the 4x4 grid in that cell).  If this also results in all cells in the main grid having only the image of their assigned value showing, EndScout is triggered with success.

When a user left clicks an item in a cell, if that item is not the secret assigned item for that cell, EndScout is triggered with a fail.  Otherwise, in the inner 4x4 grid which the item is a part of, enlarge that image to cover the full cell of the main grid (replacing the 4x4 grid in that cell).  If this also results in all cells in the main grid having only the image of their assigned value showing, EndScout is triggered with success.


EndScout:
If success, display a popup with "Scouting succeeded!".  Look up the daily_boss_lineup row for this scout page's tier to find the boss and look up the boss's details in the bosses_lookup table.  Display the boss name, image, attack affinity, and defense affinity.  Update the user_daily_boss_status table and set scouting_success to true for this user and this tier.
If fail, display a popup with "Scouting failed."  Update the user_daily_boss_status table and set scouting_success to false for this user and this tier.



Weapons:
Bow: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Copper%20Bow.png
Staff: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Bronze%20Staff.png
Axe: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Crystalline%20Battle%20Axe.png
Sword: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Copper%20Shortsword.png

Affinities:
Aquatic: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/aquatic.jpg
Fire: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/fire.jpg
Verdant: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/verdant.jpg
Mystic: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/mystic.jpg

Dice:
1: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/one.png
2: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/two.png
3: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/three.png
4: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/four.png

Armor:
Helm: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/helm.jpg
Chest: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/chestpiece.jpg
Gauntlets: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/gauntlets.jpg
Boots: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/boots.jpg