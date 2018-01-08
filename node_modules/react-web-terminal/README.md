# react web terminal

Get the AMD module located at `react-web-terminal.js` and include it in your project.

index.html contains an example of usage. Note the commandHandler function is passed as a react property:

```js
function commandHandler(component) {
    component.output('Output: ' + component.input());
}

var webTerminalComp = ReactDOM.render(
    React.createElement(WebTerminal, {commandHandler: commandHandler, prompt: '~> '}),
    document.getElementById('main')
);
```

The handler is run when enter is pressed inside the component.
The WebTerminal component is passed as a parameter to the handler. This example simply outputs the input with "Output: " prepended to it.

Also note that the component can be stored in a variable so the same functions can be used outside the component like in the example:

```js
webTerminalComp.output('Welcome!');
```

Also *also* note the styles can be overridden by prepending a selector for the component container like in the example:

```css
#main .react-web-terminal {
    background-color: #004;
}
```

## Development

* Development server `npm start`.
* Continuously run tests on file changes `npm run watch-test`;
* Run tests: `npm test`;
* Build `npm run build`;
