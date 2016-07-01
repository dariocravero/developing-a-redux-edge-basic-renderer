import { createStore } from 'redux';

const insertCharacter = char => ({
  type: 'CHARACTER_TYPED',
  char
});

const reducer = (state = '', action) => {
  switch (action.type) {
    case 'CHARACTER_TYPED':
      return state + action.char;

    case 'BACKSPACE':
      return state.substr(0, state.length - 1);

    default:
      return state;
  }
}
const store = createStore(reducer);

function View(text) {
  console.log(`"${text}"`);
}

// keep track of the previous text, i.e., the text that was rendered on the last run
let prevText;
// let's abstract our rendering logic above into a rendering function that gathers data for a view
// and renders it to the user
function render() {
  // get the text
  const text = store.getState();

  // compare them!
  if (prevText !== text) {
    // if it changed, save the new text for later reference
    prevText = text;
    // and render the changes
    View(text);
  }
}

// when the store's data changes we'll run our rendering function effectively turning it into a
// rendering loop
store.subscribe(render);

const userInput = `This is some amazing text!`;
let index = 0;
// our random tracker
let nextIsRandom = false;
const interval = setInterval(() => {
  // if we still have text to process
  if (index < userInput.length) {
    if (nextIsRandom) {
      // tell the reducer to add the character
      store.dispatch({
        type: 'RANDOM'
      });

      nextIsRandom = false;
    } else {
      // tell the reducer to add the character
      store.dispatch(insertCharacter(userInput[index++]));

      // flag every fifth character to be random
      nextIsRandom = index % 5 === 0;
    }
  } else {
    // otherwise stop
    clearInterval(interval);
  }
  // do this every 0.25 seconds (or 250ms)
}, 250);
