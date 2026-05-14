import type { PropertyValues } from "lit";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { computeCssColor } from "../../../common/color/compute-color";
import { isUnavailableState } from "../../../data/entity/entity";
import { stateColorCss } from "../../../common/entity/state_color";
import "../../../components/progress/ha-progress-bar";
import type { HomeAssistant } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { BarRowConfig, LovelaceRow } from "../entity-rows/types";
import type { LovelaceRowEditor } from "../types";

@customElement("hui-bar-row")
class HuiBarRow extends LitElement implements LovelaceRow {
  public static async getConfigElement(): Promise<LovelaceRowEditor> {
    await import("../editor/config-elements/hui-bar-row-editor");
    return document.createElement("hui-bar-row-editor");
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: BarRowConfig;

  public setConfig(config: BarRowConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    if (!config.entity) {
      throw new Error("Entity not specified");
    }
    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues<this>): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning .hass=${this.hass}>
          ${createEntityNotFoundWarning(this.hass, this._config.entity)}
        </hui-warning>
      `;
    }

    const unavailable = isUnavailableState(stateObj.state);

    const rawValue =
      this._config.attribute !== undefined
        ? stateObj.attributes[this._config.attribute]
        : stateObj.state;

    const numericValue = Number(rawValue);

    const min =
      this._config.min ??
      (stateObj.attributes.min !== undefined
        ? Number(stateObj.attributes.min)
        : 0);

    const max =
      this._config.max ??
      (stateObj.attributes.max !== undefined
        ? Number(stateObj.attributes.max)
        : 100);

    const percentage =
      unavailable || isNaN(numericValue) || max === min
        ? 0
        : Math.min(
            100,
            Math.max(0, ((numericValue - min) / (max - min)) * 100)
          );

    let barColor: string | undefined;
    if (this._config.color) {
      barColor = computeCssColor(this._config.color);
    } else if (this._config.state_color) {
      barColor = stateColorCss(stateObj) ?? undefined;
    }

    const barStyle = barColor
      ? { "--ha-progress-bar-indicator-color": barColor }
      : {};

    const valueDisplay =
      this._config.show_value && !unavailable && !isNaN(numericValue)
        ? this._config.attribute !== undefined
          ? String(rawValue)
          : this.hass.formatEntityState(stateObj)
        : nothing;

    return html`
      <hui-generic-entity-row
        .hass=${this.hass}
        .config=${this._config}
        catch-interaction
      >
        <div class="bar-container" style=${styleMap(barStyle)}>
          <ha-progress-bar
            .value=${percentage}
            ?loading=${Boolean(this._config.loading) && !unavailable}
          ></ha-progress-bar>
          ${valueDisplay !== nothing
            ? html`<span class="value">${valueDisplay}</span>`
            : nothing}
        </div>
      </hui-generic-entity-row>
    `;
  }

  static styles = css`
    .bar-container {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-1);
      flex: 1;
      min-width: 0;
      padding-inline-start: var(--ha-space-2);
    }
    ha-progress-bar {
      width: 100%;
    }
    .value {
      font-size: var(--ha-font-size-s);
      color: var(--secondary-text-color);
      text-align: var(--float-end);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-bar-row": HuiBarRow;
  }
}
