# Changelog

## 4.63.0

- **The finish goes under the text, not over it.** A finish is what the value
  is printed on; the reading of it comes first. The fill paints, then the
  material, then the words.
- **A list wearing one finish is one sheet with chips cut out of it**, not
  five little sheets. The material is laid across the whole row and each chip
  shows its own part of it, so a spectrum runs the length of the row and is
  interrupted by the gaps - which is what a printed card looks like. The same
  goes for a value's own cell: the sheet is always the row's, whichever of
  text, chip or card the colour lands on.
- The light follows the same rule: a row of chips shares one highlight instead
  of each chip carrying its own.
- **Finishes fade in and out as a value crosses from one band to another** -
  including mid-drag on a slider, where the change is most likely to be seen
  and where a hard swap flickered at every crossing. The old material fades
  out, the swap happens where nothing can be seen of it, and the new one fades
  in.

## 4.62.2

- **The light travels rather than teleports.** It eases towards wherever the
  pointer is, and there is a ceiling on how fast it may cross a value - so a
  cursor flung across the window sweeps the sheet instead of strobing it. That
  ceiling is the part a plain transition cannot give you: an eased move is
  proportional to the distance, so a big enough jump still arrives in one
  blink.
- **Taking the pointer away is a lamp being carried off, not switched off.**
  The light eases back to rest over the next few frames and is handed to the
  stylesheet exactly when it arrives - the resting values on both sides are
  the same numbers, so the handover cannot be seen.
- The frame loop stops itself once everything has settled, so a still sheet
  costs nothing, and nothing is installed at all under `prefers-reduced-
  motion` - the materials stay, the light simply never moves.

## 4.62.1

- **Each value is lit from where the pointer stands on IT**, rather than from
  where the pointer is in the window. That is the difference between a sheet
  of rows that all flash together and one that catches the light a row at a
  time as you cross it: the highlight belongs under the cursor, and the value
  under the cursor is the one wearing it.
- **The light fades with distance**, measured in each value's own terms - so a
  row two rows down goes quiet faster than one two columns across, which is
  right, and the far end of a long sheet sits almost plain.
- Still one listener and one frame of work: every box is read first and every
  property written afterwards, so the page is laid out once rather than once
  per value; values the light has left are put back to rest once and then
  skipped entirely, and scrolling counts as movement because it moves the
  values under a pointer that has not moved at all.

## 4.62.0

- **The finishes are lit by your pointer.** Fifteen materials - matte, sheen,
  mirror, foil, spectra, prism, opal, nebula, beacon, glitter, crackle, satin,
  weave, relief and hammered - each built as two layers blended into the
  palette's colour: the sheet it is made of, and the light on it. A foil that
  never catches the light is a picture of a foil; these catch it.
- **One lamp for the whole screen.** A single watcher per window follows the
  pointer and writes a few numbers on the document; every finish on every
  property reads the same ones, so the sheet is lit by one light rather than
  each row by its own - and fifty formatted rows cost one style recalculation
  a frame rather than fifty sets of listeners. A popout window gets its own
  lamp, and nothing is written at all while no finish is on screen.
- Every one of those numbers has a resting value in the stylesheet, so the
  finishes are correct with no pointer at all - on a phone, before the first
  movement, or under **reduced motion**, which keeps the material and stops
  the light. Windows High Contrast stands the whole layer down as before.
- Anything wearing one of the previous finishes is carried across: gloss reads
  as sheen, holographic as spectra, iridescent as opal, prismatic as prism,
  emboss as relief, sparkle as glitter, linen as weave, crystal as crackle and
  radiant as beacon.

## 4.61.2

- **The colour follows a slider while it is being dragged.** The row was being
  told to repaint, and reading the value out of the note - where nothing is
  written until the knob is let go. It reads the number off the cell instead,
  which every value type already rewrites as it changes, so this needs nothing
  of them and cannot be forgotten by the next one written. A unit after the
  number is fine; anything with a second number in it falls back to the stored
  value rather than guessing.
- **Pressing a section lights it up** once the scrolling settles - the heading
  and everything under it - so arriving somewhere is visible even on a page
  with nowhere left to scroll.
- **The mark keeps up with you.** It follows the pointer while it is over the
  settings (what you are pointing at is what you are reading), falls back to
  the top of the view when it is not, and a section just pressed stays marked
  for a moment whether or not the page could move to reach it.

## 4.61.1

- **The section strip keeps up with what it is describing** - another property
  picked in the options modal, another tab opened in the settings. The tabs
  are the same nodes shown and hidden rather than a re-render, so nothing was
  telling the strip its sections had been put away; it now notices for itself,
  and a page with nothing worth listing keeps watching in case the next one
  has.
- **It stands against the panel rather than the corner of the screen.** Beside
  the window by preference, on whichever side has room, and tucked inside its
  own right edge where neither side has any - never pushed out to the far
  corner, which read as belonging to the screen rather than to the settings.
- **A stop is called a point**, everywhere it is written.
- **The scale lines up with the rows above it.** Its fields, buttons and
  labels are loose elements rather than setting rows, so they were missing the
  row padding and running to the edge; they take the same measured padding the
  rest of the loose copy does, and wrap rather than overflow when the window
  is narrow.

## 4.61.0

- **The colour keeps up with a value being typed.** It was being worked out
  again on every keystroke, and painting nothing: an open editor REPLACES the
  cell it is editing, so the element carrying the colour had gone for exactly
  as long as the value was being changed. The field itself wears the colour
  now, and the half-typed number is what the colour answers to - as the drag
  of a slider already was.
- **The section strip stands outside the settings, not inside them.** It is a
  panel beside the popup or the settings window - on whichever side has room -
  with every section named in full rather than a column of dots that had to be
  approached before it would say anything. It follows the window as it moves
  and goes when the window does.
- **It shows up on the plugin's settings**, where it did not before: pinned
  inside the scrolling area, it had nothing to pin against and no width to
  live in.
- **Pressing a section takes you there.** The strip now asks the heading to
  bring itself into view, so it works whatever is doing the scrolling - a
  popup body, a modal, the settings window - rather than depending on the
  strip having correctly guessed which of them it was. Pressing it also no
  longer counts as a press outside the popup, which used to close it.

## 4.60.0

- **The finishes are redrawn as materials.** Thirteen of them - matte, gloss,
  foil, prismatic, holographic, iridescent, satin, emboss, sparkle, linen,
  crystal, radiant and hammered - each with the blend its own material asks
  for: a gloss is light added, a linen is a weave shading what lies under it,
  a matte scatters the light rather than returning it. Still all gradients,
  still nothing downloaded, still nothing that moves.
- The twenty that came before are gone, and **anything wearing one is pointed
  at its nearest survivor** rather than left bare - chrome reads as gloss,
  cracked ice as crystal, cosmic as sparkle, canvas as linen, etch and die-cut
  as emboss, prizm and refractor as prismatic.
- The finishes that are surfaces rather than light - matte, satin, linen,
  emboss, hammered - stay off bare text, where there is no material for the
  light to land on.

## 4.59.0

- **The word table builds.** *Build from glove.txt* and *Look again* both
  reported "not built" whatever you gave them: the file was being read as one
  string, and a vector file of any real size is more characters than a string
  is allowed to hold, so it failed before a single word was looked at. It is
  read as bytes and decoded a piece at a time now, so a several-hundred-
  megabyte file goes through.
- **A freshly built table shows up everywhere at once** - the sidebar, the
  table views and the pieces living in note bodies, which nothing else
  redraws. The same goes for a table found on disk when the plugin starts.
- **A timeline of the sections** runs down the side of the property settings
  (popup and modal alike) and of the plugin's own settings: it says which
  section you are reading and takes you to any other in one press. It takes no
  space of its own - the labels appear as you approach it.
- **A search box above the property settings.** Type and the rows that do not
  match go away, along with the headings left with nothing under them and the
  rail dots that led to them. What you searched for survives a redraw.
- **The colour moves with the value.** It was already worked out again on
  every change; now it travels to the new colour rather than jumping, so a
  value climbing a scale reads as a colour climbing with it. The finish over
  the top stays put, and `prefers-reduced-motion` turns the movement off.
- **The "one each" finish rule is gone.** Handing finishes round by a hash
  meant a property's look was decided by something nobody chose; a finish is
  now always something written down - everything, particular values, or a band
  of numbers. Rules saved as "one each" simply give no finish.

## 4.58.0

- **Stops and bands are one scale.** They were two palette modes that could
  not be mixed, which was a distinction without a difference: a stop is a band
  with no width. One list holds both now, in value order, and *+ stop* and
  *+ band* sit after every row - press one and a step goes in exactly there,
  taking the gap if there is one and making room if there is not.
- A stop may stand anywhere, **inside a band included**, and it wins the value
  it names. Picking one number out of a stretch - the death line, the
  threshold, the natural 20 - no longer means cutting the band in two.
- Because of that, **a band bordering a stop is not offered the edge**: the
  stop names that value outright, so there is nothing there for the band to
  win and no tick to be confused by. Edges that only meet other bands settle
  as before, exactly one owner each.
- **The colours are a list of their own.** Which colour a step wears and where
  that step sits are two different decisions, so they are held apart: drag a
  colour by its handle and it moves up or down the column, the others sliding
  out of its way, while every number stays where you put it.
- A new step arrives **coloured from the two it lands between**, and either
  side of each colour are two buttons that do the same on demand: the plain
  halfway blend, or the blend weighted by where the step actually sits - a
  stop nine tenths of the way along comes out nine tenths of the way between
  the colours.
- Existing palettes are carried over on load: stops keep blending between
  themselves and holding their end colours, which are now the *Between steps*
  and *Beyond the ends* settings written down rather than implied.

## 4.57.0

- **Conditional formatting, first part: colour.** A new *Palettes* settings tab
  makes named palettes, and a property points at one under *Formatting* in its
  own settings. Four ways of reading a value: a **wheel** sweeping a hue across
  the property's range, **stops** with colours pinned to values and blends
  between them, **bands** holding a colour flat between two edges, and **words**
  carrying colours of their own.
- Bands behave the way you would want them to: edges can be linked so moving
  one carries its neighbour, overlapping bands are refused outright, and where
  two bands share an edge a tick says which of them wins a value landing exactly
  on it. What happens beyond the ends and in the gaps is yours to choose - no
  colour, the nearest band's, or a blend across.
- **Colour lands where you say**: on the value's text, on the value in a tinted
  pill, or on the whole row. A list colours each chip by its own value and gives
  the row the blend of them.
- Every blend travels through OKLCH, so red to blue passes through the purples
  rather than through grey, and a fill gets a foreground picked by measured
  contrast unless you name one. A value failing its constraints still says so
  first.
- **Set once, everywhere**: a property's formatting is stored against the
  property, so the sidebar, the type table and inline chips agree - with an
  option to give one row a look of its own. Inline `vals:` cards wear it too.
- **The colour is reassessed whenever the value moves** - a slider mid-drag, a
  stepper, an inline edit, a chip added - not only when the note is written. A
  control that is part-way through a change says so, so the colour follows the
  knob under your finger and the digits as you type them rather than arriving
  once you let go. The foreground picked to be legible on the fill is chosen
  again with it, and belongs to everything written there: the unit suffix, the
  data-type tag, the modifier chain, a chip's remove cross.
- **Edit palette** sits beside the palette a property uses, and goes straight
  to that palette in the settings. Renaming one is live: the heading follows
  the field as you type, and every dropdown offering palettes takes the new
  name while it is on screen.
- **A shared edge always belongs to exactly one band.** The dominance ticks
  are a single choice now rather than two switches, so a value landing on a
  boundary can never fall to nobody - and an edge that no longer meets another
  drops its claim. An unclaimed meeting point goes to the band that starts
  there.
- **Changing a setting no longer throws you back to the top**, in the plugin's
  own settings as well as the popup. Rows rebuild
  whenever a change brings other options with it - a data type, a palette, a
  width that reveals a field - and the property settings popup and both
  options modals now keep their scroll position through it, restoring it again
  a frame later so a row that finishes arriving late cannot undo it.
- **Dates, derived values and formulas colour like numbers**, because that is
  what they are. A derived property is coloured by what it works out to rather
  than by the nothing it stores, and a number shown through a unit factor by
  what the reader sees.
- **A palette can be written over a calendar**: point it at a date property and
  its edges are typed and read as dates in that property's own format, while
  the engine goes on seeing the integers underneath.
- **Finishes**, laid over the colour rather than instead of it: gloss, matte,
  holographic, reverse holo, foil, prismatic, refractor, chrome, cracked ice,
  cosmic, shimmer, metallic, canvas, die-cut, parallel, mojo, wave, negative,
  etch and prizm. All of it is gradients and blend modes - nothing is
  downloaded and nothing is an image.
- A property says who wears what: everything, particular values, a band of
  numbers, or one each - a set handed round by a stable hash, so a skill wears
  the same finish every time you open the sheet. The first rule that speaks
  for a value wins, and a rule can carry a colour of its own instead of the
  palette's.
- **Nothing moves at all.** A finish is a surface, not an animation, and it
  modulates the colour the way a grain merge does: every texture is drawn
  around mid-grey and paired - a highlight always has its shadow - so a finish
  both adds to the colour and takes from it. That is what makes foil look like
  foil rather than like white paint, and it means a dark fill keeps its
  texture instead of swallowing it. Hovering changes nothing: the row's own
  hover tint is kept off anything the palette has coloured, since a colour
  that means something must not shift under the pointer. Under Windows High
  Contrast the whole layer stands down.
- **Words colour themselves.** A palette set to *Words* looks in four places
  in turn: the words you pinned by hand, the few hundred that ship with the
  plugin (colours, elements, materials, weather, states, outcomes, classes),
  the same again after the word is cut back to its stem - "poisons" reaches
  "poison" - and the optional wide table if the vault has one. A phrase takes
  the colour of the first word in it that means anything.
- A word nothing knows can be left alone or given **a colour of its own**:
  meaningless, but the same word is the same colour in every note and on every
  machine, so a vocabulary the plugin has never met still reads consistently.
- **The wide vocabulary is yours to add.** Drop a word-vector file named
  `glove.txt` into the plugin's folder - GloVe's 2024 vectors, or anything in
  the same shape - and *Build from glove.txt* in the Palettes settings turns it
  into a word-to-colour table: every word takes the colour of the anchors it
  sits nearest to. It is built once, on your machine, kept as
  `semantic-en.json` beside it, and rebuilt only when the vector file changes
  or you ask. No model runs in the plugin, no weights are bundled and nothing
  is ever downloaded - and the settings row links to where the vectors come
  from, with the credit they are due.

## 4.56.1

- **The -/+ buttons stop disappearing from rows that have room for them.** In
  a Columns or Grid section the steppers were dropped for the whole section as
  soon as its *widest* row ran out of room, so one row carrying a roll button
  and a badge took the steppers off every other row - in a 444px sidebar with
  a 214px column, a row needing 217px. The decision is made row by row now:
  only the rows that genuinely cannot fit lose their steppers, and then their
  toggles.
- **What you type shows up again.** Every cell in a value's control cluster is
  pinned to a column of its own; the editor that stands in for a value was not,
  so it was auto-placed into whatever track was free - 17 pixels wide on a
  compacted row, which is nowhere to see what you are typing. Editors now take
  the place of the value they replace, in every field: numbers, text, links
  and the long-form box.

## 4.56.0

- **A section will hand you all of its properties at once.** Right-click a
  section title and *Set a property...* opens a panel where the pointer is,
  listing every property the section holds - the empty ones first, then the
  ones with a value. Fifty blank skills no longer mean a trip into edit mode
  to start the one you want, and a property hidden for being empty is
  reachable for the first time.
- **The rows in it are the sidebar's own rows**, drawn by the same renderers:
  a number keeps its steppers and slider, a rating its pips, a colour its
  swatch, a link its note autocomplete, a roll its button. Editing one is
  editing the property - there is no second way of entering a value to learn
  or to get wrong.
- **A property can stay on show while its section is collapsed**, under
  Appearance. Hit points and armour class remain under the title of a folded
  Vitals; the rest of the section stays away. The property is fully live
  there - steppers, sliders, rolls - and a folded section is now out of the
  keyboard's way entirely, so nothing is visited twice on the way round.

## 4.55.0

- **Add folder gives you a folder field.** It was writing a blank folder into
  the settings and rebuilding the options to show it - but a blank is not a
  folder, so it was dropped on the way back and the rebuild sent the editor to
  the top. The list now grows and shrinks in place: the new field appears
  under the last one with the cursor already in it, nothing is stored until a
  folder is actually named, and removing a row no longer moves the page.
- **Allowed values behaves the same way**, for the same reasons: it was
  storing the blank row as an allowed value (a rule nothing could satisfy),
  and every add, remove and *From pool* rebuilt the editor. Both lists are now
  one piece of code, so they cannot drift apart again.

## 4.54.0

- **Every inline setting has a row of its own.** Each kind now names itself and
  is followed by one row per setting - height, width, width in pixels,
  justification, direction, axis labels, value labels, card - each with what it
  does written beside it, rather than a line of unlabelled controls. The pixel
  width appears only when the width is set to Custom.
- Those kind names are ordinary settings headings, so they carry the same type
  and padding as every other heading in the tab. They are marked as
  sub-headings, which keeps them inside the Inline pieces section instead of
  each one starting a tab of its own.

## 4.53.3

- **A justified piece no longer leaves an empty line above and below it.** The
  wrapper that carries the justification was a block, and a block inside a
  line of text splits it in three - the piece in the middle, an empty line's
  worth of space on either side. Measured in a note: a value card's line was
  141px tall around a 93px card, a roll chip's 84px around a 36px chip, a bar
  chart's 154px around a 106px chart. The wrapper is now an inline box that
  takes the whole line, and every one of those lines is exactly as tall as the
  piece in it. Only justified pieces were affected, which is why it looked
  like `vals:`, `roll:` and `bar:` had margins the others did not.

## 4.53.2

- **A chart in a card fills it.** The chart measured the whole chip, card
  border and padding included, so its drawing was scaled down to fit and
  centred - leaving a rim of empty space inside the box that read as margin.
  It now measures the room actually inside the card.
- **A chip without its pill is text.** Turning the card off a `roll:` or
  `val:` chip already took away its border, fill and padding; it now also
  gives up the taller line a pill needs, so the value sits at the height of
  the words around it. A `vals:` card without its border likewise draws
  tighter.
- Anything still drawn around a piece is the card itself - the switch at the
  end of its row in *Inline pieces* turns it off.

## 4.53.1

- **A line holding nothing but an inline piece takes no room from the lines
  around it.** The space between stacked pieces was the paragraph spacing they
  inherited from prose, plus the leading that centres text in a line; a
  paragraph containing only a piece now gives up both, so charts and cards
  written on consecutive lines stack against each other. A piece written
  inside a sentence leaves that sentence exactly as it was.

## 4.53.0

- **A piece in a note leads to its own settings.** Right-click a `val:` chip,
  a `vals:` card, a `prop:` value or any chart and there is a *Settings for
  ...* item; a roll chip's menu gains an *Appearance* button. It opens the
  plugin settings on the *Inline pieces* tab, scrolled to that kind's row and
  marked for a moment, so the switches that shape what you just right-clicked
  are the ones in front of you.
- Charts had no menu at all before this - now they have the one thing there is
  to say about them.

## 4.52.0

- **Charts can name what they draw.** Two switches per chart - axis labels
  (the property behind each value) and value labels (the number itself) - on
  sparklines, bars, radars and progress bars. Labels take their room out of
  the box before the geometry is worked out, so nothing is drawn over, and a
  name too long for its space is cut short rather than overlapping the next.
  Bars carry theirs overhead and underfoot standing up, in a gutter and past
  the end lying down; the radar's sit around the ring; a progress bar names
  itself on the left and reads out on the right.
- **Nothing is added around a piece that was not given a height.** A sized
  piece was reserving a line's worth of room whether or not it had been given
  one, which read as padding above and below every chip.
- **The box switch works both ways.** It gave a card to pieces that had none;
  it now also takes one off a piece that comes with its own - a `vals:` card's
  border and fill, or the pill a `roll:` / `val:` chip has always worn - so a
  value can sit in a sentence with nothing drawn around it at all.

## 4.51.0

- **Bars can lie down.** A dropdown on the bar row draws them standing up (as
  before) or running left to right, one row per value - the same arithmetic
  turned on its side, so both read the same.
- **A width is now a share of the text column**, as it was always meant to be.
  It was being measured against the piece's own wrapper - a few dozen pixels -
  so every share came out too narrow and stepped up to the full width, which
  is why the setting seemed to do nothing on a `vals:` card. The column is now
  the first ancestor that lays out as a block: the paragraph, the table cell,
  the callout.
- **Justification no longer moves the text around the piece.** It belongs to
  the wrapper now - a text-align rather than margins of the piece's own - so a
  chip told to sit right stays a chip in the line it was written on.

## 4.50.0

- **Inline pieces redraw the moment a setting changes.** Nothing else redraws
  a note body, so a size, width or side used to wait for the note to render
  again on its own. Every piece now repaints when the settings are saved - in
  reading mode and Live Preview - unless it is being typed into.
- **A card can be drawn around any inline piece**, per kind: the bordered,
  tinted box a `vals:` card has always had, now a toggle. The value card keeps
  its card by default and can be told to go without one.
- **Charts draw at the size they are given** rather than being stretched to
  it. Bars keep their gaps and corners at any width (a wide bar chart was
  coming out as blobs), a sparkline keeps its weight, a progress bar keeps its
  round ends and now fills the height it was given - which is why `progress:`
  appeared to ignore its size. The radar takes the largest square its box
  holds.
- The legibility floor now applies only to a piece given a width of its own,
  so a chip merely told which side to sit on stays chip-sized.

## 4.49.0

- **The key that ignores the scale is yours to choose**: Alt (Option) as
  before, or Ctrl, Shift or Cmd/Win, under *Activation* in the settings. It
  governs both dragging between the lines and clicking one to jump to it.
- **Fainter scale lines.** The primary now sits at about the old secondary's
  weight, and the secondary at about half that - present when looked for,
  quiet when not.
- **Every inline piece can be given a size and a side**, in a new *Inline
  pieces* settings tab: how many lines tall it is drawn (a radar chart on a
  single line was never really visible), how wide - full, half or quarter of
  the text column, or a width in pixels - and whether it sits left, centred,
  right, or flows in the sentence as it always did.
- A share of the column that would come out too narrow to read takes the next
  largest share instead, so a quarter-width card in a narrow pane becomes a
  half-width one rather than an unreadable sliver. A written width is likewise
  never taken below what can be read.
- Charts fill the room they are given; the radar keeps its proportions inside
  it, since a stretched radar is no longer a radar. A piece nobody has sized
  is drawn exactly as it was.

## 4.48.0

- **The whole length of a timeline line answers to the pointer.** The marker
  layer sat over the plot and swallowed every hover meant for the scale
  beneath it, leaving only the sliver above and below the plot to hover. It
  now lets the pointer through everywhere except on a marker itself.
- **Hold Alt (Option) and click a primary line to send the handle there.**
  Without the key a press still belongs to the handle, exactly as before.

## 4.47.0

- **Hold Alt (Option) to pass between the lines.** Dragging a slider or
  stepping it with the arrow keys settles on the nearest line as before;
  holding the key sets the value exactly where you put it.
- **Timeline intervals are written in the property's own calendar**: `1Y`,
  `6M`, `3D`, `12h`, `30m` - a year being however many days a year holds
  here, and `M` months against `m` minutes, as in the format strings. Terms
  add up (`1Y 6M`), a plain number still means what it did, and whatever you
  type reads back the way you wrote it.
- **Hover a primary line to read it.** On a slider it names the value at that
  position, formatted exactly as the value is - fractions, unit and all; on a
  timeline, the date in the property's format. Hovering a line or a note
  marker gives it the same focus ring a property gets, and a line beneath a
  marker never takes the pointer from it.
- **Thinner scale.** Primary and secondary lines are now the same single pixel
  in the same colour, differing only in height and how present they are.
- **Sliders have a rail**: a one-pixel line spanning the whole slider, there
  before anything is dragged, so the extent the handle travels is visible.

## 4.46.0

- Housekeeping: the readme installs from the community store, the release
  workflow can be run by hand, and two lint warnings are gone. No change to
  how anything behaves.

## 4.45.0

- **Percent reads as the number it stands for**: `50%` is 0.5, `7.5%` is
  0.075, `200 * 15%` is 30. In a property already kept in percent, `50%` is
  the fifty it says - the unit is the field's own, so writing it changes
  nothing.
- `10 % 3` is still the remainder. A percent sign is a percent when nothing
  follows for it to divide into: the end of the field, an operator, or a
  closing bracket.

## 4.44.1

- **A property that names its own unit is kept in that unit.** A field marked
  ft resolves what you type into feet, one marked kg into kilograms, whatever
  the vault-wide setting says for that quantity - the number stored belongs to
  the property. Other quantities still follow the settings, and a unit the
  table does not know ("XP", "%") changes nothing.

## 4.44.0

- **Numeric fields take arithmetic.** Type `12*3`, `(8+4)/2`, `120/2.5` and it
  is worked out when you leave the field. Anything that does not work out
  leaves the value as it was, rather than storing nonsense.
- **They take measurements too.** `1\'2" - 5cm` reads as one foot two inches
  less five centimetres; `3 lb + 12 oz` and `1 gal - 2 cup` read as you would
  expect. Feet and inches need no operator between them, the way they are
  written everywhere.
- **A new Units section in the settings** sets the unit each quantity is kept
  in - length, weight, volume, area, pressure, energy, power, time and speed -
  with the choices grouped by system. Everything typed is converted into it, so
  the same typing stores 12.03 where lengths are inches and 30.56 where they
  are centimetres.

## 4.43.0

- **Snapping is now two switches: to primary lines, to secondary lines, or
  both.** They decide the interval between them, so there is no range to set -
  a value settles on the nearest line of whichever sets are on, which is what
  snapping to a scale means. Each switch appears once its interval does.
- Snapping to secondary lines includes the places a primary sits on, even
  though only the primary is drawn there: it is a multiple of that interval
  either way.
- A property that had the old switch on gets both new ones, for whichever
  intervals it has; the range it carried is dropped.

## 4.42.0

- **Scale lines on a slider and on the date timeline.** A primary and a
  secondary interval, each yours to set, drawn as single-pixel verticals - the
  primary taller and darker. Where a secondary line falls on a primary one,
  only the primary is drawn. The timeline reads its intervals in days.
- **Snap to the lines**, for sliders: dragging or stepping settles on the
  nearest line when it is close enough. How close is yours to set, default
  0.5, capped at half the finest interval - beyond that every value is already
  within reach of a line, and snapping stops meaning anything.
- Lines are drawn under the knob and take no presses, so nothing about
  dragging changes, and a range too fine to draw (more lines than pixels) is
  left blank rather than filled in.

## 4.41.0

- **Show the denominator**, per property and on by default. Turn it off and
  the value reads as the whole number, a divider and the numerator - two and
  three eighths as 2.3 - which is how a scale of eighths is often written down.
  The numerator is then always over the largest denominator, since a reduced
  one could not be read back.
- **The divider is yours to set** (default "."), and **a suffix** can follow
  the value in either mode: 2.3" for inches, 2¾ in for the same value spelled
  out.

## 4.40.1

- **Always use the largest denominator**, per property: every fraction is
  written over the same one - 6/8 rather than three quarters - the way a scale
  of eighths reads. A whole number still shows as one, and a fraction that
  already sits over that denominator keeps its glyph.

## 4.40.0

- **"Whole numbers only", on by default**, replaces "Allow fractions" and
  reads the other way round. Nothing changes for existing properties: a
  number that said nothing rounded before and still does, and one moved over
  from Decimal has the switch off.
- **Show a number as a fraction.** 1.5 reads as 1½, 0.67 as ⅔, 3.0625 as
  3 1/16 - the glyph where Unicode has one, "a/b" where it does not, always in
  lowest terms. Available on any number that keeps its fractions.
- **The largest denominator is yours to set**, default 8: eighths by default,
  4 for quarters, 16 for sixteenths. A value that rounds to a whole number
  shows as one, never as "2 0/8".

## 4.39.0

- **Decimal has moved into Number**, which was all the type ever was: a number
  that keeps its fractions. Number carries an "Allow fractions" switch, and
  decimal properties move across on load - every entry for the key, on every
  sheet and inline - with a button in their settings for anyone who wants to
  do it by hand first.
- Nothing else about a moved property changes. The range it falls back to when
  neither it nor the vault says otherwise now follows the switch rather than
  the type, so a slider stays where it was instead of stretching to a whole
  number's default range.
- Decimal is no longer offered for new properties, is no longer behind a
  feature toggle (a layout that still carries it must render), and reads
  "Decimal (moved to Number)" where it can still appear. The 5e sheet's Height
  property is seeded as a fractional number.

## 4.38.1

- **A link field never gives a link back as plain text.** It stores a typed
  name as a link whether or not the note exists yet - the same as Obsidian's
  own unresolved links, and the same as the field already draws it. Before, a
  name whose note could not be resolved was stored bare, so opening and
  closing the field over a link could quietly unlink it; turning "Links to a
  note" off then left plain text where a link had been.

## 4.38.0

- **A link property can draw from several folders.** Source folder is now a
  list you add to, the same way allowed values are: a folder per row with its
  own picker and a remove button. A note in any of them is offered, and a new
  one is made in the first - so "Characters" can sit above "Villains" and get
  the new arrivals.
- The single folder earlier versions stored becomes the first entry of the
  list on load, and is still read wherever it turns up later - an imported
  layout, an old snapshot - so nothing loses its scope.

## 4.37.0

- **A link field reads and writes note names, not bracket syntax.** Opening one
  shows "Ada" where the value is `[[Ada]]`, and picking a suggestion puts the
  name in the box. The brackets are put back when the value is stored, so
  nothing about the note changes.
- **A name that comes to mean a note becomes a link.** Type a name before its
  note exists and it stays plain text; once the note is there - made through
  the suggestion list, or anywhere else - the next commit stores it as a link.
  Turning "Links to a note" off leaves the link where it is.
- **Following an unresolved link makes the note in the property's folder**, not
  wherever new notes usually go, and links it.
- **Allowed values are a list you add to**, a value per row with a remove
  button, rather than one comma-separated box.
- **Fill them from what the property already holds** across the vault, with one
  button - usually the list you were about to type out.
- **Clear all validation** on a property in one go.

## 4.36.1

- Closed the three ways a link property could come back after the move: a
  section or type imported from an older vault, a layout file written by one,
  and a restored snapshot. Each now moves its link entries across as it lands,
  and a restored snapshot re-runs the schema steps its own stamp says it
  missed.
- The Link type is always registered rather than sitting behind a feature
  toggle. It is offered nowhere, but a layout that still carries it renders as
  a link instead of falling back to plain text because a toggle was off; the
  toggle itself is gone from the settings.

## 4.36.0

- **Link properties move to the Text type by themselves.** Loading this version
  converts every property still typed as a link - on every sheet, inline, and
  in the shared type map - into a text property with "Links to a note" on,
  keeping its source folder and the rest of its settings. Nothing in your notes
  changes: the values were already links. The step runs once and is recorded in
  the settings schema, so a second load does nothing.
- The Link type stays registered for a layout imported from an older vault,
  where it now reads "Link (moved to Text)" and offers the same move.

## 4.35.0

- **The Link type is no longer offered for new properties.** It has moved into
  Text, which carries the same field behind "Links to a note". Properties
  already using it keep working and keep their settings; their settings page
  says where the type has gone and offers the move.
- A text property that links to notes now renders as a link in the type table
  too, as the Link type always did.

## 4.34.0

- **A link property can move to the Text type, keeping everything.** Its
  settings carry a "Move to the Text type" button: the property becomes text
  with "Links to a note" on, and its source folder, subfolders, only-existing
  and offer-to-create settings come with it. Nothing about the value changes -
  it was already a link in the note.
- The move reaches every entry showing that property, on every sheet and
  inline, because the data type is shared per property key and a half-moved
  key would render one way in one place and another elsewhere. Settings an
  entry had made for itself are kept. It is reversible while the Link type
  exists: set the data type back to Link.

## 4.33.0

- **A text property can link to a note.** Switch on "Links to a note" and the
  value shows as a link - a bare name counts - and editing offers notes, with
  the same source folder, only-existing and offer-to-create settings the Link
  type has. The two are now one field: the Link type is built on it, so
  neither can drift from the other.
- **Allowed values can be offered rather than only enforced.** A text property
  set to offer them suggests the list written under Validation while editing,
  narrowing as you type, and "Only offered values" refuses anything else -
  which makes a Status property a dropdown of Draft / Active / Completed.

## 4.32.1

- A link property's source folder now includes what is below it by default. A
  folder of characters that grows a "Minor" subfolder still holds characters,
  so the narrower reading was the wrong way round; turn the switch off to keep
  to the folder itself.

## 4.32.0

- **A link property can be told which folder its notes come from.** Set a
  source folder on the property and editing it offers only the notes in that
  folder - "characters", "locations", "items" - narrowing as you type. Notes in
  folders below it are offered too if you ask for them.
- **Editing a link no longer means typing a wikilink.** The value opens in
  place, like every other value does, and typing a name lists the notes it
  could mean: no `[[` first, and picking one writes the link. It replaces the
  prompt window, which offered nothing at all.
- **Only existing notes**, per property: a value that names no note on offer is
  refused rather than stored, and a link pointing outside the property's folder
  reads as unresolved, since for that property it is.
- **Offer to create**, per property: when the name matches nothing, the list
  ends with an entry that makes the note in the source folder and links it.

## 4.31.1

- Retyping a list-valued type property mapped over values the review guide
  reads as untyped. The values are kept as unknown, which is what they are.

## 4.31.0

- **Tab walks a context menu**, forward and back with shift, moving the same
  selection the arrows move. Tab used to walk straight past an open menu into
  the view behind it.
- **Escape closes a context menu without landing in the note.** Obsidian
  answers Escape by putting focus in the editor, so a keyboard trip through the
  sidebar ended in the note whenever a menu was dismissed. The menu now answers
  the key first, and focus stays on the row it was opened from.
- Two focus checks were looking for a class the view does not carry, so they
  never matched: focus sitting on the row when a menu closed did not count as
  the view's, and the row was left to whatever took focus next. Both now test
  the class the view actually has.

## 4.30.4

- **Holding a key no longer takes the first item as the menu opens.** The hold
  fires while the key is still down, so its repeats and its release landed on
  the menu or popup that had just appeared - and Space and Enter take whatever
  is highlighted there. What is left of that press is now eaten, up to and
  including the release, so the menu opens on its first item and waits.

## 4.30.3

- **Escape returns to the row, not the note.** Obsidian answers an element
  holding focus being removed by putting focus back in the active editor, and
  that landed before the check for whether focus was going spare - so the note
  looked like somewhere the user had chosen to be, and was left alone. Whether
  focus is ours to give back is now decided the moment the overlay lets it go,
  and the row takes it back over the frames that follow, unless focus has since
  gone somewhere in the sidebar deliberately.
- **The popup holds on to the keyboard.** Same cause: the editor took focus
  straight back off it. The popup takes it back in turn for its first moment on
  screen - never from a layer it opened itself, and not for long enough to
  fight a real attempt to leave.
- The focused toolbar button is now ringed in the accent colour, which reads
  against the button's own background; the border colour it used before did
  not.

## 4.30.2

- **The popup shows where the keyboard landed.** It had been taking focus on
  itself, which nothing marks - the container carries no focus ring - so it
  looked as though nothing was focused at all. Focus now goes to a real
  control: the first button on its toolbar, which is visibly focused. Its
  first *field* is still left alone, since focusing one springs its
  autocomplete open.
- The close button moved to the end of the toolbar, so the button the popup
  opens focused is a useful one rather than the one that throws it away.
- Focus is re-asserted over the first few frames after opening, so the tail of
  the press that opened the popup cannot take the keyboard back.

## 4.30.1

- **Focus comes back to the row after the popup closes.** Two things stopped it:
  the popup was still holding focus when it reported itself gone - which reads
  as focus the user chose, and is left alone - and the row it was opened from
  had never truly held focus, only the glow that stands for it. The row now
  takes the focus and the tab stop, the popup lets focus go before reporting,
  and a row rebuilt by a re-render in the meantime is found again by its id.
- **Opening the popup puts the keyboard in it**, rather than leaving it on the
  sidebar behind. This needs 4.30.0 or later installed.

## 4.30.0

- **The settings popup takes the keyboard when it opens.** It had been opening
  behind the scenes as far as the keyboard was concerned: nothing in it was
  focused, so Escape had nothing to reach and Tab carried on from wherever the
  press had left off. The popup itself now holds focus - not its first field,
  which would spring that field's autocomplete open - so Escape closes it and
  Tab walks into its toolbar and rows.
- **A close button on the popup toolbar**, as a way out that does not depend on
  a key: Escape can be claimed by whatever else is listening, and a press
  outside is not an obvious way to close.
- **A menu opened by a hold keeps its highlighted first item.** The highlight
  was going on and coming straight back off, because a menu opened mid-press
  gets the rest of that press - the release, and the drift of the cursor around
  it - on the menu that has just appeared underneath. The highlight is now put
  back once the press ends, and only when nothing is highlighted, so the item
  the cursor genuinely rests on is left alone.

## 4.29.1

- **Escape closes the settings popup.** Two faults, either of which was enough
  to stop it: the handler ignored the key whenever it came from inside the popup
  - the usual case - and the check for a layer in front matched elements merely
  present in the DOM, which Obsidian's parked suggestion container and menu
  always are. Escape now closes it wherever focus is, and only a layer actually
  on screen takes the key first. It listens both directly and through Obsidian's
  keymap, so whichever sees the key first, the popup closes.
- **Opening a menu highlights its first item**, so Enter takes it or the arrows
  move on, instead of a key press being needed just to enter the list. The
  highlight is Obsidian's own selection, not a mark of ours, so the menu's idea
  of where you are stays true.

## 4.29.0

- **One overlay at a time.** A context menu and the property-settings popup are
  opened by different gestures on the same row, and each only knew how to close
  its own kind - so a hold after a right click left two of them stacked. They
  share one slot now: opening either closes whatever was open, whichever gesture
  or surface it came from.
- **Closing one hands focus back to the control that opened it**, so Tab carries
  on from there instead of restarting at the top of the view. Focus is only
  restored when it was left dangling: if you have already clicked or tabbed
  somewhere deliberate, that wins.
- Escape now closes the settings popup through Obsidian's keymap rather than a
  listener of our own, which its own scope claimed first. A suggestion list,
  menu or modal opened from inside the popup still answers Escape before the
  popup does, because it pushes its scope above it.

## 4.28.0

- **The menu button answers to held and double keys.** Holding Enter or Space
  on it runs whatever the hold gesture is mapped to - the property settings by
  default - with the same charging ring a press draws; two quick taps run the
  double-click mapping; one tap still opens the menu. So a keyboard reaches
  every mapped action, not just the one action the button carries. The same
  applies to a card's menu button in a note.
- With a double-tap action mapped, a single tap waits out the double-tap window
  first, and a key released elsewhere never leaves a ring charging.

## 4.27.2

- **Tab reaches every control again, not only the values.** The chain was
  limited to fields to fill, which meant it skipped the steppers, roll buttons,
  chips, menu buttons and section headers that plain tabbing used to reach. It
  now stops on anything a keyboard can operate, in screen order, still opening a
  value it lands on. The row wrapper (which carries a tabindex for arrow
  navigation) and disabled controls are passed over.
- The era chip on a date is keyboard-operable now - focusable, with Enter or
  Space opening its era menu.

## 4.27.1

- Opening on arrival is now a setting - *Tab opens the field*, with the other
  interaction settings, on by default. Off, Tab only moves the focus and Enter
  or Space opens what it lands on.

## 4.27.0

- **Tab fills in a note.** Tab moves to the next value and opens it, so you can
  type straight away; Shift+Tab goes back. The chain now covers checkboxes and a
  list's add button as well as text and number fields, in the order they appear
  on screen, and skips anything inside a collapsed section.
- It works whether or not a field is already open - Tab from a value you clicked
  into, or from one you reached with the keyboard - and a field opens on arrival
  whatever gesture the mouse is set to, single or double click.
- Running out of fields hands the key back to the browser, so focus leaves the
  sidebar normally rather than being trapped in it.

## 4.26.0

- **An empty value is a strip to click, not a dash to hit.** The value cell now
  takes the row's free width and routes its own presses to the value, so
  clicking anywhere in that area starts editing - the way a properties panel
  behaves. Content stays right-aligned, so nothing moves; the area lights up on
  hover to show what it is.
- Presses on a child of the cell still belong to that child (a link opens, an
  era chip picks an era), and the cell itself is not marked editable - so a hold
  or right click over the empty part still reaches the row's own gestures
  instead of being swallowed.

## 4.25.1

- **No more strip of settings scrolling above the search bar.** The bar was
  sticky, and a sticky element parks at its scroll container's padding box -
  Obsidian's container, not ours - so rows scrolled into that strip stayed
  visible above it, with nothing of ours able to reach up and cover them. The
  bar now scrolls with the content, and switching tabs scrolls back to it.

## 4.25.0

- **Nine settings tabs instead of seventeen**, each holding related sections
  with their headings intact:
  - **Types** - the type list and Defaults
  - **Sections** - new section defaults
  - **Modifiers** - the building blocks
  - **Short forms**
  - **Dice & rolls** - dice, rolls and saved rolls
  - **Editing outside edit mode**
  - **Interface** - typography, interface features, Obsidian, always-hidden
    properties and UI text
  - **Features** - features and value types
  - **Reset**, last
- Tabs follow that order rather than the order the body happens to render in,
  and a section no tab claims still gets one of its own, just before Reset - so
  a new section is never lost by forgetting to list it.
- Searching now works section by section within a tab: a matching heading shows
  its section whole, and a section's blurb travels with the section rather than
  with a row that happened to match.

## 4.24.1

- The intro paragraph above the settings is gone; the tabs and the search box
  start the tab.
- Section descriptions line up with their rows again. They moved one level
  deeper when the body became tabs - inside the section's panel - and the rule
  that aligns loose copy only reached the level above.

## 4.24.0

- **The settings are tabs now**, one section at a time instead of one long
  scroll: Type, Defaults, Dice, Rolls, Features and the rest. The body is still
  written as a single document and partitioned by its headings when it renders,
  so a new section becomes a tab on its own - there is no list to keep in step.
- **A search box above the tabs filters every section at once.** Matching rows
  appear under their section heading, so a result says where it lives; a
  section whose heading matches shows whole, which keeps the bespoke editors
  (types, macros, short forms) findable. A clear button empties the box - the
  settings window claims Escape before a field inside it sees it.
- The open tab and the search text survive the re-render that follows a change,
  and the box keeps focus and caret while you type.

## 4.23.0

- **A text property can edit in a box that grows.** *Options -> Text ->
  Expanding text box* swaps the one-line field for a text area that follows its
  content up to twelve rows and then scrolls, for paragraph-length values like
  a description. Enter adds a line; Ctrl/Cmd+Enter, Tab or clicking away saves,
  Escape cancels. The value keeps its line breaks and wraps when shown, instead
  of being cut to a single line. Off by default, and off means the single-line
  field with value suggestions, unchanged.
- **Lists can be added to without entering edit mode.** The add button used to
  appear only while arranging a layout, which left the right-click menu as the
  only way to fill a list while entering data. It is always there now - quiet
  until the row is hovered - and the picker it opens still adds a known value on
  click and stays open for the next one.

## 4.22.0

- **A double click is now a mappable gesture too.** *Double click on a
  property* joins click, hold, right click and right-click-and-hold, with the
  same choices - context menu, property settings, focus, nothing - and defaults
  to nothing, so no vault changes behaviour on upgrade.
- Values keep their own behaviour: a double click on the value opens its editor
  when that is the activation gesture chosen for it, and the row's mapping
  applies to the rest of the row. With a click action mapped as well, the click
  waits out the double-click window first, so a double click no longer fires
  the single-click action twice on its way.

## 4.21.2

- **Repeating an action no longer stacks context menus.** Obsidian dismisses a
  menu when a press lands outside it, but the controls that open ours stop that
  press from travelling (otherwise the row's gestures fire too), and a keyboard
  activation dismisses nothing - so pressing the same button twice left two
  menus on screen, slightly offset. Every menu the plugin opens now goes through
  one place, and opening one closes whichever was open before it. That covers
  the row menu, the type chip, sections, inline cards, the table, dice and date
  menus alike.

## 4.21.1

- **Space on the menu button opened two menus.** The row is a focusable group
  whose own Enter/Space opens its menu, and that listener is delegated - so a
  key pressed on a control inside the row reached it as well, and both acted.
  The row's activation now applies only when the row itself has focus; a
  control keeps its own. Arrows still navigate from anywhere inside, so focus
  is never trapped. This also affected pressing Space on a value, which opened
  its editor and the context menu at once.

## 4.21.0

- **A per-property menu button.** *Appearance -> Menu button* puts a vertical
  three-dot button at the end of the row outside edit mode, opening the same
  menu a right-click does. It is appended after the value type has rendered, so
  it sits to the right of the roll button where there is one and at the end of
  the row where there is not - the same for every data type, every layout mode,
  and for cards in notes (which open their own card menu). Off by default.
- The edit-mode menu button now draws the same vertical-dots icon instead of
  three full stops, so the two are one control in two places.

## 4.20.0

- **Single click can open a value outside edit mode.** A new *Editing outside
  edit mode* section sets the gesture per surface - property values, checkboxes,
  proficiency checkboxes, values in notes, table cells - so the sidebar can be a
  data-entry surface rather than a display that guards its values. Every surface
  defaults to double click, exactly as before; nothing changes until you say so.
  Edit mode still opens on a single click, since that mode is for arranging.
- Checkboxes set to single click toggle on their own click, so they take one
  hit rather than two quick ones. Enter and Space keep working either way.
- A click on a link inside a value follows the link instead of opening the
  editor, and the second click of a fast double click no longer reopens what
  the first click just opened.

## 4.19.1

- **The type chip carries the type's own menu.** Right-click it for everything
  the settings tab offers per type - retype the note, rename, choose or reset
  the icon, reset the layout, copy the snippet, delete - next to the note it
  applies to instead of four clicks away in settings.
- Deleting a type is one code path now, shared by the chip and the settings
  tab: the layout, the icon and the vault layout file go, and the notes keep
  their value (they stop matching a layout, which is undoable; losing the
  property would not be).

## 4.19.0

- **Types can be renamed.** Each type row has a rename button; the layout, the
  icon and any rolls scoped to that type move with it. This is what lets a vault
  adopt a property it already uses - point the type property at `category`,
  rename `sims` to `sim`, and those notes are recognized straight away, with no
  layout rebuilt and nothing renamed in the notes.
- **Optionally rewrite the notes too.** The dialog counts the notes carrying the
  old value up front ("Also update 214 notes") and, when left on, changes the
  value in each of them - list values keep their other entries, and renaming
  onto a value a list already holds does not duplicate it.
- **Renaming onto an existing type merges the two**, with a choice of which
  layout survives. The dialog says so before you commit, and its button reads
  Merge rather than Rename.
- A rename no longer resurrects the old type. Between changing the settings and
  rewriting the notes the two disagree by design, and the sidebar - which adopts
  any type it does not recognize - would recreate the one just renamed away.

## 4.18.4

- Review compliance: the popup's dismissal and control checks use Obsidian's
  cross-window `.instanceOf(...)` rather than `instanceof`, so they still hold
  in a popped-out window - where an element comes from that window's own class
  and a plain `instanceof` is false.

## 4.18.3

- Review compliance: `ValueTypeDef.menuItems` declares `this: void`. The
  settings popup holds the function on its own to decide whether to offer its
  value-actions button, so the contract that it never depends on its defining
  object is now stated in the type rather than assumed.

## 4.18.2

- **Autocomplete shows up in the settings popup.** The list was opening all
  along - correctly placed, fully rendered - with the popup painted on top of
  it, because both sat on the same layer and Obsidian's suggestion container
  precedes the popup in the document. The popup now sits one layer lower, so
  suggestions, menus, notices and modals all come out in front of it, exactly
  as they do over the full property settings.
- Choosing a suggestion no longer throws: the rows underneath were rebuilt
  while the list was still closing over the field, which aborted the rebuild
  (`NotFoundError` on the container). This affected the full settings window
  too.

## 4.18.1

- **The settings popup only closes when you click away from it.** Using a row
  could dismiss it: a native dropdown draws its option list outside the page,
  so the press that picked an option was read as a press elsewhere. The same
  went for anything a row opens beside the popup - autocomplete lists, menus,
  the icon picker and other prompts - and Escape closed the popup instead of
  the list or modal in front of it. All of those now belong to the popup, so
  its dropdowns and suggestions behave exactly as they do in the full property
  settings.
- Rows that rebuild after a change (renaming the property, switching its data
  type) keep their scroll position instead of jumping back to the top.

## 4.18.0

- **One press, one action on mobile.** A touch screen has a single long press,
  and it is also the platform's context-menu press - so a hold could fire the
  hold mapping and the right-click mapping at once. Mobile now routes every
  long press through the *right click and hold* option and swallows the native
  context menu. The interaction settings show that one option there (named
  "Long press on a property") instead of four, and desktop carries a note
  explaining what mobile will do.
- **The settings popup arrives as a sheet on mobile**, the way menus do there:
  along the bottom edge, full width, with thumb-sized toolbar buttons.
- **The popup covers the whole context menu.** Value-type actions - edit value,
  pick a color, add an item, roll - were the one group with no equivalent row
  in the settings body; they now hang off a toolbar button, so nothing is
  reachable only by right-clicking.

## 4.17.1

- **Settings text lines up again.** Drawing the tab inside a setting row (4.17.0)
  left the loose prose - the intro, section blurbs like "Crit threshold per die
  size...", the override search field and its hints - flush against the panel
  edge while every setting row sat indented, and the intro sat hard against the
  top in body-sized text. The tab now measures a real row's padding and matches
  it on all three sides, and the intro reads as a description like every other
  blurb.

## 4.17.0

- **The settings tab renders on Obsidian 1.13 again.** 1.13 draws a tab from its
  setting definitions and only falls back to `display()` when there are none - and
  in 1.13.4 that fallback did not fire here, so the tab showed an empty
  placeholder. It now declares a `render` item and draws itself inside that row,
  which also puts it back in the settings search (every section heading is an
  alias, so searching "dice" or "features" finds it).
- Removed three redundant type assertions flagged by the plugin review.


Everything since 4.10.1, grouped by what it changes.

### Works with an existing vault

- **The type property is configurable.** *Settings -> Types -> Type property* (default `Type`). Point it at a property you already use - `category`, `kind`, anything - and the plugin recognizes those notes retroactively: the sidebar match, the property index's buckets, the table view and the properties-panel menu all read the configured name, and assigning a type writes to it. No renaming, no double entry, no clash with other plugins that use `Type`.
- **The interface speaks that name.** Every string that means the note-type concept renders your property's name - the no-type screen, the chip tooltip, the entry-options heading, the table view and command, settings headings and prompts, import/export, macros, snapshots, layout files, the inline sheet block. Wherever the name appears in prose it carries a slight accent tint - applied by a pass over the rendered settings tab and sidebar, so it reaches strings that reach the DOM as plain text too. Prose only: values, fields, code and buttons keep the theme's own styling. Renaming the property re-renders the settings tab at once. Strings about *data* types keep saying "type" and are never highlighted - "data type", "value type", "number type", "date/time type" and friends name the value-type system, not this one, which matters most when the property is itself called Type.

### Types in the sidebar

- **The type chip is an editor.** Click it for a text field with a dropdown of every type, filtered as you type. Pick one to retype the note; type a new name to create it, with a prompt to start it as a copy of the current layout or empty.
- **Per-type icons**, chosen from Obsidian's icon picker, with a configurable default (`tag`) for types that define none, and a reset button to fall back to it.
- **A note with no type** offers "+ New type" alongside the existing assign buttons, and those buttons now work on the first click.
- **The header sheds in stages** as room runs out: the Edit button collapses to its icon, then the chip drops its label and keeps its icon, then both wrap onto their own line beneath the title with their labels back.

### Interaction mapping

- **Four mappable gestures** on a property - click, hold, right click, right click and hold - each set to Context menu, Property settings, Focus, or Nothing. Hold and right-hold default to the property settings; right click to the menu; plain click to nothing.
- **Hold to configure**: a ring charges around the cursor (500ms, adjustable 200-2000ms) and opens a scrollable popup carrying the property's full settings page - compact, menu-shaped, with an icon toolbar mirroring the context menu (open full settings, hide/show, clear value, remove row/column, remove entry) and descriptions on hover. Animated in and out.
- **In-note cards and chips** share the same mapping, each keeping its own menu contents.

### Building blocks

- **Each modifier building block carries its own reference suffix**: `Level.pb` applies the proficiency bonus to Level, `Strength.am` the ability modifier to Strength - in expressions, derived formulas and inline chips. Defaults `pb` and `am`; blank means not referenceable.
- The modifier short-form setting moved into the building-blocks section, beside the per-block suffixes.

### Data entry

- Tab and Shift+Tab commit the current value and move to the next or previous editable value in the sidebar.

### Fixes

- A quick click no longer charges the hold ring; releases anywhere cancel it.
- Column dividers are drawn only between cells that genuinely sit side by side, and the wrap divide marks the wrapped row rather than every cell - removed entirely in grid mode, where it flickered and left artefacts.
- An edit followed by a focus change no longer loses its value: a reload mid-write keeps keys whose write is still queued (this silently dropped type assignments, and could drop ordinary property edits).
- The settings tab renders again - 4.10.1's `getSettingDefinitions()` made Obsidian render definitions instead of the tab, leaving every setting inert.
- Review compliance: Obsidian's `createEl`/`createDiv`/`createFragment` helpers replace all `document.create*` calls.

---

Older releases are listed in the GitHub release history.
