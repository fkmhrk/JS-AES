import { Ractive } from "../ractive";
import { MDCRipple } from "@material/ripple";

export const mdcRipple = (node: HTMLElement, ...args: any[]) => {
    new MDCRipple(node);
    return {
        teardown: () => {},
    };
};

const Button = Ractive.extend(<any>{
    template:
        "<button as-mdc-ripple" +
        ' class="mdc-button {{#if accent}}mdc-button--raised{{/if}} {{class}}"' +
        ' on-click="@this._click()"' +
        ' disabled="{{disabled}}">' +
        '   <span class="mdc-button__label">{{yield}}</span>' +
        "</button>",
    decorators: {
        "mdc-ripple": mdcRipple,
    },
    _click: function() {
        this.fire("click");
    },
});

export default Button;
