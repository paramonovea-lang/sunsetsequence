// The soundfont reader must give Strudel the same zones as before, and refuse anything but data.
import { describe, expect, it } from 'vitest';
import { parseSoundfont } from './soundfont-data';

// Shape of a real file from webaudiofontdata/sound (1265_Aspirin_sf2_file.js), shortened.
const REAL = `console.log('load _tone_1265_Aspirin_sf2_file');
var _tone_1265_Aspirin_sf2_file={
	zones:[
		{
			midi:126
			,originalPitch:12700
			,keyRangeLow:0
			,keyRangeHigh:127
			,loopStart:-1
			,loopEnd:-2
			,coarseTune:0
			,fineTune:0
			,sampleRate:44100
			,ahdsr:false
			,file:'SUQzBAAAAAAAI1RTU0UAAAAPAAAD//tAwAAAAA=='
			,anchor:0.00165533
			//_tone.saw_880_R_ /* a note */
		}
		,{
			midi:126,originalPitch:6600-140+40,keyRangeLow:64,keyRangeHigh:127,loopStart:10,loopEnd:2000
			,coarseTune:0,fineTune:-12.5,sampleRate:22050,ahdsr:[{duration:0,volume:1}],sample:"QUJD"
		}
	]
};
`;

describe('parseSoundfont', () => {
  it('reads the zones of a real preset file', () => {
    const zones = parseSoundfont(REAL);
    expect(zones).toHaveLength(2);
    expect(zones[0]).toMatchObject({ midi: 126, originalPitch: 12700, loopStart: -1, loopEnd: -2, ahdsr: false, sampleRate: 44100 });
    expect(zones[0].file).toBe('SUQzBAAAAAAAI1RTU0UAAAAPAAAD//tAwAAAAA==');
    expect(zones[1]).toMatchObject({ originalPitch: 6500, fineTune: -12.5, keyRangeLow: 64, sample: 'QUJD' });
    expect(zones[1].ahdsr).toEqual([{ duration: 0, volume: 1 }]);
  });

  it('refuses code where data should be', () => {
    for (const bad of [
      'var x={zones:[alert(1)]}',
      'var x={zones:[{a:(1)}]}',
      'var x={zones:[{a:`t`}]}',
      'var x={zones:[{a:1+x}]}',
      'var x={zones:[{a:1*2}]}',
      'var x={zones:[{a:window.name}]}',
      'var x={zones:[{a:function(){}}]}',
      "var x={zones:[{a:'open}]}",
    ]) {
      expect(() => parseSoundfont(bad), bad).toThrow(/soundfont/);
    }
  });

  it('needs a zones array of objects', () => {
    expect(() => parseSoundfont('nothing here')).toThrow(/no preset/);
    expect(() => parseSoundfont('var x={other:[]}')).toThrow(/no zones/);
    expect(() => parseSoundfont('var x={zones:[1]}')).toThrow(/bad zone/);
  });

  it('does not let a key reach the object prototype', () => {
    const [zone] = parseSoundfont('var x={zones:[{__proto__:{polluted:1},midi:1}]}');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(zone.midi).toBe(1);
  });
});
