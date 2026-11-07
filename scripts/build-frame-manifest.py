"""Export timings for the persistent PNG-frame player from the generated GIFs."""
import json
from pathlib import Path
from PIL import Image
repo=Path(__file__).resolve().parents[1]
result={}
for group in ['v3','sleep-v1']:
 for gif in sorted((repo/'public/companion'/group).glob('*.gif')):
  im=Image.open(gif); durations=[]
  for i in range(im.n_frames):
   im.seek(i); durations.append(im.info['duration'])
   assert (gif.parent/f'{gif.stem}-{i+1:02}.png').exists()
  result[gif.stem]={'group':group,'durations':durations,'loop':gif.stem in ['idle','sleeping']}
(repo/'src/lib/companion-frames.json').write_text(json.dumps(result,indent=2)+'\n')
