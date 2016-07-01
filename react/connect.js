import React, { Component, PropTypes } from 'react';

export default function connect(ComponentToConnect, mapState, actionsToDispatch) {
  class ConnectedComponent extends Component {
    constructor(props, context) {
      super(props, context);

      // the store comes as a prop to our component
      const { store } = context;

      // get the initial state from the store
      this.state = mapState(
        store.getState()
      );

      // subscribe to changes and set the component's state when anything changes
      this.cancelSubscription = store.subscribe(() => {
        this.setState(
          // map the state to what the view requested
          mapState(
            store.getState()
          )
        );
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
      // our component should be invisible so we should proxy the props that we get from above,
      // we will also pass the sliced state that we captured from our store and filtered as the
      // view wanted, and
      // we will pass the actions ready to be dispatched
      return <ComponentToConnect {...this.props} {...this.state} {...this.actions} />;
    }
  }

  // tell React that we're expecting a redux store like prop called store
  ConnectedComponent.contextTypes = {
    store: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired
    })
  };

  return ConnectedComponent;
}
