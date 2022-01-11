/*!
 * Bravo for Power BI
 * Copyright (c) SQLBI corp. - All rights reserved.
 * https://www.sqlbi.com
*/

import {  _, __ } from '../helpers/utils';
import { Doc, DocType } from '../model/doc';
import { i18n } from '../model/i18n'; 
import { strings } from '../model/strings';
import { ConnectMenuItem } from './connect-item';

export class ConnectFile extends ConnectMenuItem {

    render(element: HTMLElement) {
        super.render(element);
        
        let html = `
            <div class="drop-area list">
                <p>${i18n(strings.connectDragFile)}</p>
            
                <div class="browse button">
                    ${i18n(strings.connectBrowse)}
                </div>
            </div>
            <input type="file" class="file-browser" accept=".vpax">
        `;
        this.element.insertAdjacentHTML("beforeend", html);

        _(".browse", this.element).addEventListener("click", e => {
            _(".file-browser", this.element).dispatchEvent(new MouseEvent("click"));
        });

        _(".file-browser", this.element).addEventListener("change", e => {
            
            let fileElement = (<any>e.target);
            if (fileElement.files) {
                let files: File[] = fileElement.files;
                if (files.length) {
                    let file = files[0];
                    let fileHash = Doc.getId(DocType.vpax, file);

                    if (this.dialog.openDocIds.indexOf(fileHash) > -1) {
                        this.dialog.data.switchToDoc = fileHash;
                        this.dialog.trigger("action", "cancel");
                        
                    } else {

                        this.dialog.data.doc = new Doc(file.name, DocType.vpax, file);
                        this.dialog.trigger("action", "ok");
                    }
                }
            }
        });
        

        let dropArea = _(".drop-area", this.element);
        dropArea.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length) {
                let file = e.dataTransfer.files[0];
                if (file.name.slice(-5) == ".vpax") {
                    this.dialog.data.doc = new Doc(file.name, DocType.vpax, file);
                    this.dialog.trigger("action", "ok");
                }
            }
        }, false);

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.add('highlight');
            }, false);
        });
          
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.remove('highlight');
            }, false);
        });
    }
}