# Rendering

We now have a way to understand how our app changes in a structured way, we need to display that
somehow and interact with our user.

To get started we will work with a very basic view engine that renders to `console.log` and we will
gradually transition to `React` and its official binding with `redux`: `react-redux`.
Understanding how the mechanism works from scratch allows us to connect our data in a more sensible
way going forward and detect potential bottlenecks, etc.

## The basic renderer
Continuing with our example above, we'll write a view function that show characters as we type them.
Let's define our basic renderer:

```javascript
function View(text) {
  console.log(`"${text}"`);
}
```

Nothing really fancy all, just piping in the input text to the console and wrapping it with double
quotes.

Our store will be a slightly simplified version of the editor example above:

```javascript
import { createStore } from 'redux';

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
```

Now that we have a store and our view, let's do a first render:

```javascript
// get the text
const text = store.getState();
// and render it!
View(text);
// the console should've logged an empty string
```

Let's simulate the user typing in some text through time by using the `insertCharacter` action we
defined previously:

```javascript
const userInput = `This is some amazing text!`;
let index = 0;
const interval = setInterval(() => {
  // if we still have text to process
  if (index < userInput.length) {
    // tell the reducer to add the character
    store.dispatch(insertCharacter(userInput[index++]));
  } else {
    // otherwise stop
    clearInterval(interval);
  }
  // do this every 0.25 seconds (or 250ms)
}, 250);
```

Our view is rather static, it is in fact a function and unless we call it won't know that it should
be showing anything different to the user. Luckily for us, whenever the state changes in redux we
get a chance to do something with that change through `store.subscribe`. Let's see how that works:

```javascript
// let's abstract our rendering logic above into a rendering function that gathers data for a view
// and renders it to the user
function render() {
  const text = store.getState();
  View(text);
}

// when the store's data changes we'll run our rendering function effectively turning it into a
// rendering loop
store.subscribe(render);
```

Go ahead and try that yourself. Here's what the final result looks like:

[basic-output.jpg]

In a more complex application a user would be probably doing more things that would eventually
dispatch other actions through our store. However, our rendering loop will always run and despite
the fact that our View's data hasn't changed it will still run it.
In real life we'll have many views present on screen, of which most of them would be somehow
connected to our store and listening for data changes, so it's our responsibility to ensure that we
don't waste the user's computational resources in operations that don't need to happen in the first
place and leave room for those who do.

Let's expand our fake user interaction from above to include some other type of actions being
dispatched from time to time:

```javascript
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
```

Here's the output with the unnecessary re-renders flagged in green:

[basic-output-repeated.jpg]

Hopefully that example, despite its simplicity, can illustrate the re-rendering problem.
In order to render the bare minimum we'll need to keep track of data changes to determine whether
we should render or not.
Our render function seems like a great candidate for it since it already takes care
of getting the data and showing it. Let's refactor it to meet our needs then:

```javascript
// keep track of the previous text, i.e., the text that was rendered on the last run
let prevText;
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
```

Our output should look exactly the same as it did before the introduction of an extra action being
dispatched.
