import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/ha-form/ha-form";
import type { SchemaUnion } from "../../../../components/ha-form/types";
import type { HomeAssistant } from "../../../../types";
import type { BarRowConfig } from "../../entity-rows/types";
import type { LovelaceRowEditor } from "../../types";

@customElement("hui-bar-row-editor")
export class HuiBarRowEditor extends LitElement implements LovelaceRowEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: BarRowConfig;

  public setConfig(config: BarRowConfig): void {
    this._config = config;
  }

  private _schema = memoizeOne(
    () =>
      [
        { name: "entity", required: true, selector: { entity: {} } },
        {
          name: "name",
          selector: { entity_name: {} },
          context: { entity: "entity" },
        },
        {
          name: "icon",
          selector: { icon: {} },
          context: { icon_entity: "entity" },
        },
        {
          name: "attribute",
          selector: { attribute: {} },
          context: { filter_entity: "entity" },
        },
        {
          name: "min",
          selector: { number: { mode: "box", step: "any" } },
        },
        {
          name: "max",
          selector: { number: { mode: "box", step: "any" } },
        },
        {
          name: "color",
          selector: { ui_color: {} },
        },
        {
          name: "state_color",
          selector: { boolean: {} },
        },
        {
          name: "show_value",
          selector: { boolean: {} },
        },
        {
          name: "loading",
          selector: { boolean: {} },
        },
      ] as const
  );

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema()}
        .computeLabel=${this._computeLabelCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, "config-changed", { config: ev.detail.value });
  }

  private _computeLabelCallback = (
    schema: SchemaUnion<ReturnType<typeof this._schema>>
  ) => {
    switch (schema.name) {
      case "attribute":
      case "color":
      case "min":
      case "max":
      case "state_color":
      case "show_value":
      case "loading":
        return this.hass!.localize(
          `ui.panel.lovelace.editor.card.bar-row.${schema.name}`
        );
      default:
        return this.hass!.localize(
          `ui.panel.lovelace.editor.card.generic.${schema.name}`
        );
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-bar-row-editor": HuiBarRowEditor;
  }
}
