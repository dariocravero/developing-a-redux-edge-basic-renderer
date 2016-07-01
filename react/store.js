import { createStore } from 'redux';

export const insertCharacter = char => ({
  type: 'CHARACTER_TYPED',
  char
});

export const removeCharacter = () => ({
  type: 'BACKSPACE'
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
export const store = createStore(reducer);
