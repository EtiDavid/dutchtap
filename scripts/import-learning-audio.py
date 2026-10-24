"""Inspect/cut a batch recording using its exported transcript. Dry run by default.
Never calls a paid API. Requires ffmpeg and ffprobe. No audio exists until supplied.
"""
import argparse, hashlib, json, pathlib, re, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
def inspect_segments(audio, count):
    duration = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(audio)],text=True))
    result = subprocess.run(['ffmpeg','-nostdin','-i',str(audio),'-af','silencedetect=noise=-40dB:d=2.5','-f','null','-'],capture_output=True,text=True,check=True)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)',result.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)',result.stderr)]
    silences = list(zip(starts,ends))
    interior = [(a,b) for a,b in silences if a > .3 and b < duration-.3]
    if len(interior) != count-1:
        raise ValueError(f'Found {len(interior)} internal long pauses, expected {count-1}. No cuts installed. Use an explicit --segments JSON list of [start,end] seconds after checking the recording.')
    # Cut at pause midpoints, leaving padding around speech rather than trimming words.
    bounds = [0]+[(a+b)/2 for a,b in interior]+[duration]
    return list(zip(bounds,bounds[1:]))

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=pathlib.Path,required=True);p.add_argument('--batch',required=True);p.add_argument('--audio',type=pathlib.Path,required=True)
    p.add_argument('--segments',type=pathlib.Path);p.add_argument('--apply',action='store_true')
    args=p.parse_args();manifest=json.loads(args.manifest.read_text());batch=next((b for b in manifest['batches'] if b['id']==args.batch),None)
    if not batch:raise ValueError('Unknown batch ID.')
    if not manifest.get('approvedOnly'):raise ValueError('This is a draft/unreviewed export. Review the text and export approved content before installation.')
    rows=batch['items']
    for row in rows:
        expected=hashlib.sha256((row['lang']+'\0'+row['text']).encode()).hexdigest()[:24]
        if row['id'] != expected or row['lang'] not in ['nl','en'] or row['lang']!=manifest['language']:raise ValueError('Manifest text, language or ID was modified.')
    segments=json.loads(args.segments.read_text()) if args.segments else inspect_segments(args.audio,len(rows))
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(args.audio)],text=True))
    if len(segments)!=len(rows):raise ValueError('Segment count must match transcript count.')
    previous=0
    for row,(start,end) in zip(rows,segments):
        if not (0<=previous<=start<end<=duration+.02) or end-start<.3:raise ValueError('Invalid/overlapping/empty segment.')
        previous=end
        print(f'{row["id"]} {start:.3f}–{end:.3f}: {row["text"]}')
    if not args.apply:
        print('DRY RUN: no files changed. Check that each segment contains exactly its printed text before --apply.');return
    index_path=ROOT/'data/audio-index.json';index=json.loads(index_path.read_text());target=ROOT/'public/audio/utterances';target.mkdir(parents=True,exist_ok=True)
    # Render the whole batch in a private temporary directory before installing any clip.
    with tempfile.TemporaryDirectory(prefix='dutchtap-audio-') as temp:
        rendered=[]
        for row,(start,end) in zip(rows,segments):
            dest=target/(row['id']+'.mp3')
            if dest.exists():raise ValueError(f'Clip already exists; refusing to overwrite {dest.name}.')
            clip=pathlib.Path(temp)/(row['id']+'.mp3')
            subprocess.run(['ffmpeg','-nostdin','-v','error','-ss',str(start),'-i',str(args.audio),'-t',str(end-start),'-codec:a','libmp3lame','-b:a','96k',str(clip)],check=True)
            if clip.stat().st_size<100:raise ValueError('Empty generated clip.')
            rendered.append((row,clip,dest))
        for row,clip,dest in rendered:
            dest.write_bytes(clip.read_bytes())
            index['items'][row['id']]={'text':row['text'],'lang':row['lang'],'path':'/audio/utterances/'+dest.name,'checksum':hashlib.sha256(dest.read_bytes()).hexdigest()}
        temporary=index_path.with_suffix('.part');temporary.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');temporary.replace(index_path)
    print(f'Installed {len(rows)} clips. Rebuild the app to use its updated audio index.')

if __name__=='__main__':main()
