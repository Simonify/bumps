import exampleBump from './example';

export default function getBump() {
  let bump;

  if (window.location.hash.length > 1) {
    try {
      bump = window.JSON.parse(window.decodeURIComponent(window.location.hash.substr(1)));
    } catch (err) {
      console.error(err);
      window.alert('Could not load bump from URL.');
    }
  }

  if (!bump) {
    let savedBump = window.localStorage.getItem('bump');

    if (typeof savedBump === 'string') {
      try {
        bump = window.JSON.parse(savedBump);
      } catch (e) {
        console.error(err);
        window.alert('Could not load bump from local storage.');
      }
    }
  }

  if (!bump) {
    bump = exampleBump;
  }

  return bump;
}
