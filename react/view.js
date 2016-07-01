import { connect, Provider } from 'react-redux';
import { insertCharacter, removeCharacter, store } from './store';
import { render } from 'react-dom';
import React, { Component, PropTypes } from 'react';

class View extends Component {
  constructor(props) {
    super(props);
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
  insertCharacter: PropTypes.func.isRequired,
  removeCharacter: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  text: state
});

const mapDispatchToProps = {
  insertCharacter,
  removeCharacter
};

const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(View);

render(
  <Provider store={store}>
    <ConnectedComponent />
  </Provider>,
  document.getElementById('root')
);
