import { insertCharacter, removeCharacter, store } from './store';
import { render } from 'react-dom';
import React, { Component, PropTypes } from 'react';

class View extends Component {
  constructor(props) {
    super(props);

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

    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          fontSize: '4em',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%'
        }}
      >
        {text.length ? (
          <div
            style={{
              width: 720,
              wordWrap: 'break-word'
            }}
          >
            {text}
          </div>
        ) : (
          <div
            style={{
              color: 'lightgray'
            }}
          >
            (type something)
          </div>
        )}
      </div>
    );
  }
}
View.propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired
  })
};

render(
  <View store={store} />,
  document.getElementById('root')
);
