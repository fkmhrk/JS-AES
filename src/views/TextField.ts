import { Ractive } from "../ractive";
import { MDCTextField } from "@material/textfield";

export const mdcText = (node: HTMLElement, ...args: any[]) => {
    new MDCTextField(node);
    return {
        teardown: () => {},
    };
};

const TextField = Ractive.extend({
    template:
        '<div as-mdc-text class="mdc-text-field {{class}}">' +
        "<input " +
        '  type="{{type}}"' +
        '  class="mdc-text-field__input"' +
        '  id="{{id}}"' +
        '  name="{{name}}"' +
        '  value="{{value}}"' +
        "  {{#if required}}required{{/if}}/>" +
        '<label class="mdc-floating-label" for="{{id}}">{{label}}</label>' +
        '<div class="mdc-line-ripple"></div>' +
        "</div>",
    decorators: {
        "mdc-text": mdcText,
    },
});

export default TextField;
