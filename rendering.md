## Connecting redux to our UI

We now have a way to understand how our app changes in a structured way, we need to display that
somehow and interact with our user.

To get started we will work with a very basic view engine that renders to `console.log` and we will
gradually transition to `React` and its official binding with `redux`: `react-redux`.
Understanding how the mechanism works from scratch allows us to connect our data in a more sensible
way going forward and detect potential bottlenecks, etc.

### The basic renderer
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

### The path to React

Now that we know the basics of rendering our potential UI with redux, let's get that editor into a
more useful renderer like React. This time, instead of faking the user's input we'll actually listen
to what they type on the screen.

In our previous example both, the subscription to the redux store and the reference to the previous
text were part of our scope. React allows us to encapsulate that within a component which makes it
easier to reuse, let's do that instead. It's refactor time!

```javascript
// we've extracted the store into its own file for this example
import { insertCharacter, removeCharacter, store } from './store';
import { render } from 'react-dom';
import React, { Component, PropTypes } from 'react';

class View extends Component {
  constructor(props, context) {
    super(props, context);

    // the store comes as a prop to our component
    const { store } = props;

    // get the initial state from the store
    this.state = {
      text: store.getState()
    };

    // subscribe to changes and set the component's state when anything changes
    this.cancelSubscription = store.subscribe(() => {
      this.setState({
        text: store.getState()
      });
    });

    this.onCharacter = this.onCharacter.bind(this);

    // listen to keystrokes in the 
    document.addEventListener('keyup', this.onCharacter);
  }

  componentWillUnmount() {
    // clean up our binding to keydown on the document
    document.removeEventListener('keyup', this.onCharacter);
    // also clean up our subscription to the storee
    this.cancelSubscription();
  }

  onCharacter(event) {
    const { dispatch } = this.props.store;

    if (event.key === 'Backspace') {
      // if the user pressed the backspace, remove the last character
      dispatch(removeCharacter());
    } else if (event.key.length === 1) {
      // otherwise, when a keystroke came our way, add it!
      dispatch(insertCharacter(event.key));
    }
  }

  render() {
    const { text } = this.state;

    // the example includes styles that are omitted for brevity
    return (
      <div>
        {text}
      </div>
    );
  }
}
// tell React that we're expecting a redux store like prop called store
View.propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired
  }).isRequired
};

// render our component
render(
  <View store={store} />,
  document.body
);
```

Our React component above abstracts the complexity of dealing with the redux store. However, as our
application grows, connecting to the store will become a repetitive task and, if repeated along
across components, it will make our logic more complex and error prone.
It is also a good practice to try and keep our React components as stateless as possible, e.g., our
component above could have been as simple as: `const View = ({ text }) => <div>{text}</div>`.

That makes it easier to test it and to separate concerns as we can compose that component more
easily.

There are two key parts to our component:
1) knowing that we have a redux store, connecting to that store and updating the view with its
changes, and
2) rendering the text on screen as the user types

Let's separate those into their own components, shall we?

Our View needs to know that a new key was pressed and tell the store about it; it also needs to
render the current text. That translates to roughly the following component:

```javascript
import React, { Component, PropTypes } from 'react';

class View extends Component {
  constructor(props, context) {
    super(props, context);
    this.onCharacter = this.onCharacter.bind(this);
    // listen to keystrokes in the 
    document.addEventListener('keyup', this.onCharacter);
  }

  componentWillUnmount() {
    // clean up our binding to keydown on the document
    document.removeEventListener('keyup', this.onCharacter);
  }

  onCharacter(event) {
    const { props } = this;

    if (event.key === 'Backspace') {
      // if the user pressed the backspace, remove the last character
      props.removeCharacter();
    } else if (event.key.length === 1) {
      // otherwise, when a keystroke came our way, add it!
      props.insertCharacter(event.key);
    }
  }

  render() {
    const { text } = this.props;

    return (
      <div>
        {text}
      </div>
    );
  }
}
View.propTypes = {
  insertCharacter: PropTypes.func.isRequired,
  removeCharacter: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired
};
```

Notice how our View now doesn't take a `store` as props anymore but instead it takes `text` and
functions to insert and remove characters. Congratulations! As it doesn't know anything about the
store, we've just made our component reusable!

Now it's time for our store connector. We know that we have to send the view a part of the state
and some functions that will eventually dispatch an action in our store.
Because we can't be certain as to what part of the state or actions our view will need, we should
give it the freedom to define them. We will use functions to achieve that.
As a rough first approximation we could probably say that such connector's function signature
could be along the lines of:
```javascript
connect(ComponentToConnect: ReactComponent, mapState: Function, actionsToDispatch: Object) :
ReactComponent
```

Ideally we would wrap our view in this connected component with something like this:

```javascript
const ConnectedComponent = connect(
  // the component we want to connect
  View,
  // the piece of the state we want to get back
  state => ({
    text: state
  }),
  // the actions that we want to dispatch
  {
    insertCharacter,
    removeCharacter
  }
);
```

Now that we now how we would want to use it, let's try and implement our `connect` function!

```javascript
function connect(ComponentToConnect, mapState, actionsToDispatch) {
  class ConnectedComponent extends Component {
    constructor(props, context) {
      super(props, context);

      // the store comes as a prop to our component
      const { store } = props;

      // get the initial state from the store
      this.state = store.getState();

      // subscribe to changes and set the component's state when anything changes
      this.cancelSubscription = store.subscribe(() => {
        this.setState(store.getState());
      });

      // map the actions that the view wants to dispatch to the store
      this.actions = {};
      Object.keys(actionsToDispatch).forEach(action => {
        this.actions[action] = (...args) => {
          store.dispatch(
            actionsToDispatch[action](...args)
          )
        };
      });
    }

    componentWillUnmount() {
      // clean up our subscription to the storee
      this.cancelSubscription();
    }
    render() {
      // our component should be invisible so we should proxy the props that we get from above
      // and the sliced state that we captured from our store and filtered as the view wanted
      return <ComponentToConnect {...this.props} {...this.state} />;
    }
  }

  // tell React that we're expecting a redux store like prop called store
  ConnectedComponent.propTypes = {
    store: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired
    }).isRequired
  };

  return ConnectedComponent;
}
```

We're almost set! Our components are now rendering and they are isolated from our redux store.
There's one issue though, as we go deeper into our React tree, we would have to remember to pass
down the `store` prop so that every other component can also connect to it.
This quickly becomes very tedious and error prone as it's very easy to forget to pass the store
every time, needless to say that it makes your components' logic muddy right away.

There's one more refactor that we can make: we can use React's context to make the store only be
available to views in the React tree at request. This would allow us to forget about passing down
the store prop and it will define the scope for our connection with redux very well as only the
the connect function will need to know about it. Win-win! Let's see how this root store provider
would look like:

```javascript
import { Children, Component, PropTypes } from 'react';

class Provider extends Component {
  constructor(props, context) {
    super(props, context);
    // get the store from the props
    this.store = props.store;
  }

  // expose the store as a child context for components that request it
  getChildContext() {
    return {
      store: this.store
    };
  }

  // only take one children and render it
  render() {
    return Children.only(this.props.children);
  }
}

// define the props that we take as a component
Provider.propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired
  }).isRequired,
  children: PropTypes.element.isRequired
};
// define the prop types that children can claim through context
Provider.childContextTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired
  }).isRequired
};
```

Our connector also has to be refactored so that it gets its store from the context instead its
props.

```javascript
function connect(ComponentToConnect, mapState, actionsToDispatch) {
  class ConnectedComponent extends Component {
    constructor(props, context) {
      super(props, context);

      // the store comes as a prop to our component
      const { store } = context;

      // ...omitted for brevity
    }

    // ...omitted for brevity
  }

  // notice how we declare contextTypes instead of propTypes here
  ConnectedComponent.contextTypes = {
    store: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired
    }).isRequired
  };

  return ConnectedComponent;
}
```

Now in our final render method, we wrap our component with the Provider passing the store as its
prop:

```javascript
render(
  <Provider store={store}>
    <ConnectedComponent />
  </Provider>,
  document.getElementById('root')
);
```

Let's recap what we've done so far. We started with a React component that was doing everything from
getting new data from the store to rendering it. We gradually extracted the key pieces until we got
to three main concepts: `Provider`, `connect` and our `View`. In short, `Provider` is our bridge
to tell `connect` which store to use when a `View` uses it.

Luckily for us, the redux community has already sorted this problem and packaged it into
`react-redux`. The solution is quite similar to what we got to with a difference in how `connect`
works, which instead of having a signature like:

```javascript
connect(ComponentToConnect: ReactComponent, mapState: Function, actionsToDispatch: Object) :
ReactComponent
```

it has:

```javascript
connect(mapStateToProps: Function, mapDispatchToProps: Object | Function) : Function
// the returned Function has a signature of
connected(ComponentToConnect: ReactComponent) : ReactComponent

// mapStateToProps has the following signature
mapStateToProps(state: Object, props: Object) : Object

// mapDispatchToProps is generally used in one of two ways
// by providing a function that gets a dispatch method and you're in charge of mapping to an object,
// this is handy if you need to transform data before passing it into the action creator before
// calling it
mapDispatchToProps(dispatch: Object, props: Object) : Object
// or it takes an object with actions that the library will auto-map to dispatch as we did in our
// example above
mapDispatchToProps = actions: Object
```

In order to use `react-redux`, the only change we need to make to our View is on the connected
component:

```javascript
const ConnectedComponent = connect(
  // the piece of the state we want to get back
  state => ({
    text: state
  }),
  // the actions that we want to dispatch
  {
    insertCharacter,
    removeCharacter
  }
)(View);
```

In practice, it is a good idea to extract `mapStateToProps` and `mapDispatchToProps` into their
own functions so that they're easier to read. So the example above would look like:

```javascript
const mapStateToProps = state => ({
  text: state
});

const mapDispatchToProps = {
  insertCharacter,
  removeCharacter
};

const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(View);
```

This also allows us to easily test both functions in isolation:
```javascript
test('mapStateToProps', ({ end, deepEquals }) => {
  deepEquals(
    mapStateToProps('TEXT'),
    { text: 'TEXT' }
  );

  end();
});
```

In future chapters we will dive into how to use state selectors within `mapStateToProps` to
achieve a more idiomatic definition and in many cases get performance gains while rendering.
