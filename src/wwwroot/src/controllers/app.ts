/*!
 * Bravo for Power BI
 * Copyright (c) SQLBI corp. - All rights reserved.
 * https://www.sqlbi.com
*/

import { Dic, _, __, Utils } from "../helpers/utils";
import { i18n } from '../model/i18n'; 
import { strings } from '../model/strings';
import { Sidebar } from '../view/sidebar';
import { Tabs, AddedTabInfo, RemovedTabInfo } from '../view/tabs';
import { WelcomeScene } from '../view/scene-welcome';
import { Doc, DocType } from '../model/doc';
import { Confirm } from '../view/confirm';
import { Connect, ConnectResponse } from '../view/connect';
import { Sheet } from './sheet';
import { PageType } from './page';

export class App {

    sheets: Dic<Sheet> = {};
    welcomeScene: WelcomeScene;
    element: HTMLElement;
    sidebar: Sidebar;
    tabs: Tabs;
    defaultConnectSelectedMenu: string;

    constructor() {

        this.element = _(".root");

        let sidebarItems: Dic<string> = {};
        for(let type in PageType) {
            sidebarItems[type] = i18n((<any>strings)[type]);
        }
        this.sidebar = new Sidebar("sidebar", this.element, sidebarItems);

        this.tabs = new Tabs("tabs", this.element);

        this.listen();

        this.showWelcome();
    }

    // Event listeners
    listen() {

        // Catch dropping external files
        window.addEventListener('dragover', e => { 
            e.preventDefault();
        });
        window.addEventListener('drop', e => { 
            e.preventDefault(); 
            if (e.dataTransfer.files.length) {
                this.dragFile(e.dataTransfer.files[0]);
            }
        });

        this.tabs.on("open", () => {
            this.connect(this.defaultConnectSelectedMenu);
        });

        this.tabs.on("close", (data: RemovedTabInfo) => {
            if (data.id in this.sheets) {
                if (this.sheets[data.id].doc.isDirty) {

                    let dialog = new Confirm();
                    dialog.show(i18n(strings.confirmTabCloseMessage)).then((response: ConnectResponse) => {
                        if (response.action == "ok")
                            this.tabs.closeTab(data.element);
                    });

                }else {
                    this.tabs.closeTab(data.element);
                }
            }
        });

        this.tabs.on("remove", (id: string) => {
            this.removeSheet(id);
        });

        this.tabs.on("noTabs", () => {
            this.showWelcome();
        });

        this.tabs.on("change", (id: string) => {
            this.showSheet(id, <PageType>this.sidebar.currentItem);
        });

        this.sidebar.on("change", (id: string) => {
            if (this.tabs.currentTab) 
                this.showSheet(this.tabs.currentTab, <PageType>id);
        });
    }

    addSheet(id: string, doc: Doc) {

        let container = this.tabs.body;
        if (this.welcomeScene)
            this.welcomeScene.hide();

        let sheet = new Sheet(id, container, doc);
        this.sheets[id] = sheet;

        sheet.on("sync", ()=>{
            this.tabs.updateTab(id, doc.name);
        });
    }

    removeSheet(id: string) {

        if (id in this.sheets) {
            this.sheets[id].destroy();
            delete this.sheets[id];
        }
    }

    showSheet(id: string, page: PageType) {

        //Hide all other sheets
        for (let _id in this.sheets) {
            if (_id != id)
                this.sheets[_id].hide();
        }

        let sheet = this.sheets[id];
        sheet.show();
        sheet.showPage(page);
    }


    switchToDoc(docId: string) {
        for (let id in this.sheets) {
            if (this.sheets[id].doc.id == docId) {
                this.tabs.changeTab(id);
                return true;
            }
        }
        return false;
    }

    showWelcome() {
        if (!this.welcomeScene) {
            this.welcomeScene = new WelcomeScene("welcome", this.tabs.body);
            this.welcomeScene.on("quickAction", (selectedMenu: string) => { 
                this.connect(selectedMenu);
            });
        }
        this.welcomeScene.show();
    }

    connect(selectedMenu: string) {

        let openedDocs = [];
        for (let id in this.sheets)
            openedDocs.push(this.sheets[id].doc.id);

        let dialog = new Connect(openedDocs);
        dialog.show(selectedMenu)
            .then((response: ConnectResponse) => {
                if (response.data) {
                    switch (response.action) {
                        case "ok":
                            if (response.data.doc) {

                                let id = Utils.DOM.uniqueId();
                                this.addSheet(id, response.data.doc);
                                this.tabs.addTab(id, response.data.doc);
                            }
                            break;

                        case "cancel":
                            if (response.data.switchToDoc) {
                                this.switchToDoc(response.data.switchToDoc);
                            }

                            break;
                    }
                    
                    if (response.data.lastOpenedMenu)
                        this.defaultConnectSelectedMenu = response.data.lastOpenedMenu;
                }
            });
    }


    dragFile(file: File) {
        if (file.name.slice(-5) == ".vpax") {
            let fileHash = Doc.getId(DocType.vpax, file);
            if (!this.switchToDoc(fileHash)) {

                let doc = new Doc(file.name, DocType.vpax, file);
                let id = Utils.DOM.uniqueId();
                this.addSheet(id, doc);
                this.tabs.addTab(id, doc);
            }
        }
    }
}