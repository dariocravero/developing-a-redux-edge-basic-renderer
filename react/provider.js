import { Children, Component, PropTypes } from 'react';

export default class Provider extends Component {
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
