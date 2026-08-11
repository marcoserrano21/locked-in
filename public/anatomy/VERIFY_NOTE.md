# Muscle SVG verify note

## Inspection (pre-slice)
- Prior front/back files in Downloads/files were ALREADY sliced into separate
  data-muscle-group paths (not single compounds), with wrong/swapped labels.
- Source musclemap.svg: path[0]=back (39 numbered), path[1]=front (41 numbered).
- Rebuilt via separate front_source.svg / back_source.svg compound files.

## front_muscles.svg
Group / path ids:
- #body-outline
- #chest (data-muscle-group=chest)
- #neck (data-muscle-group=neck)
- #shoulders (data-muscle-group=shoulders)
- #biceps (data-muscle-group=biceps)
- #abs (data-muscle-group=abs)
- #forearms (data-muscle-group=forearms)
- #quads (data-muscle-group=quads)
- #abductors (data-muscle-group=abductors)
- #adductors (data-muscle-group=adductors)
- #calves (data-muscle-group=calves)

## back_muscles.svg
Group / path ids:
- #body-outline
- #neck (data-muscle-group=neck)
- #traps (data-muscle-group=traps)
- #shoulders (data-muscle-group=shoulders)
- #triceps (data-muscle-group=triceps)
- #back (data-muscle-group=back)
- #forearms (data-muscle-group=forearms)
- #lower_back (data-muscle-group=lower_back)
- #glutes (data-muscle-group=glutes)
- #hamstrings (data-muscle-group=hamstrings)
- #calves (data-muscle-group=calves)
