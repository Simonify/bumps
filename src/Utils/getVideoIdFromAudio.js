import * as TypeConstants from '../Constants/TypeConstants';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;

export default function getVideoIdFromAudio(audio) {
  if (audio) {
    const url = audio.get('url');

    if (url) {
      switch (audio.get('type')) {
        case TypeConstants.YOUTUBE:
          const match = url.match(YOUTUBE_REGEX);

          if (match) {
            return match[1];
          }
          break;
      }
    }
  }

  return false;
}
