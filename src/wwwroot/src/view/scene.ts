/*!
 * Bravo for Power BI
 * Copyright (c) SQLBI corp. - All rights reserved.
 * https://www.sqlbi.com
*/

import { debug } from '../debug/debug';
import { Dic, _ } from '../helpers/utils';
import { Doc } from '../model/doc';
import { strings } from '../model/strings';
import { View } from './view';

export interface SceneType {
    name: string
    scene: (id: string, container: HTMLElement, doc: Doc) => Scene
}

export class Scene extends View {
    doc: Doc;
    title: string;
    refreshing = false;

    constructor(id: string, container: HTMLElement, title: string = "", doc: Doc = null) {
        super(id, container);
        this.element.classList.add("scene");

        this.doc = doc;
        this.title = title;
    }

    render() {
        let html = `
            <header>
                <h1 class="icon">${this.title}</h1>
                <div class="toolbar">
                    <div class="ctrl-refresh ctrl icon-refresh" title="${strings.refreshCtrlTitle}" ${this.doc.type == "vpax" ? "disabled" : ""}></div>
                </div>
            </header>
            <div class="scene-content">
            </div>
        `;
        this.element.insertAdjacentHTML("beforeend", html);

        this.body = _(".scene-content", this.element);

        _(".ctrl-refresh", this.element).addEventListener("click", e => {
            e.preventDefault();
            console
            if ((<HTMLElement>e.currentTarget).hasAttribute("disabled")) return;
            this.refresh();
        });
    }

    renderError(error: Error) {

        let message = (error && error.message ? `${strings.errorGeneric} : ${error.message}` : strings.errorUnspecified);
        if (message.slice(-1) != ".") message += ".";

        let html = `
            <div class="error">
                <div class="icon icon-bravo-error"></div>
                <h1>${strings.errorTitle}</h1>
                <p>${message}</p>
            </div>
        `;

        this.element.insertAdjacentHTML("beforeend", html); 

        if (debug)
            console.error(error);
    }

    load() {
        if (!this.doc.loaded) {

            this.element.insertAdjacentHTML("beforeend", `<div class="loader"></div>`);

            this.doc.refresh()
                .then(resolve => this.render())
                .catch(error => this.renderError(error))
                .finally(() => {
                    _(".loader", this.element).remove();
                });
        } else {
            this.render();
        }
    }

    refresh() {
        if (this.refreshing) return;
        this.refreshing = true;
        this.element.classList.add("refreshing");
        this.trigger("refresh");
        this.doc.refresh().then(() => {
            this.refreshing = false;
            this.element.classList.remove("refreshing");
            this.update();
        });
    }

    update() {
        // Do nothing, just override
    }


}