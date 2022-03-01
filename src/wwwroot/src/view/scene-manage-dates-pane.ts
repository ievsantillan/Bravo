/*!
 * Bravo for Power BI
 * Copyright (c) SQLBI corp. - All rights reserved.
 * https://www.sqlbi.com
*/

import { OptionsStore } from '../controllers/options';
import { OptionValidation } from '../helpers/renderer';
import { host } from '../main';
import { DateConfiguration, TableValidation } from '../model/dates';
import { Doc } from '../model/doc';
import { i18n } from '../model/i18n';
import { PBIDesktopReport } from '../model/pbi-report';
import { strings } from '../model/strings';
import { ManageDatesConfig } from './scene-manage-dates';

export class ManageDatesScenePane {

    doc: Doc;
    element: HTMLElement;
    config: OptionsStore<ManageDatesConfig>;

    constructor(config: OptionsStore<ManageDatesConfig>, doc: Doc) {
        this.config = config;
        this.doc = doc;
    }

    render(element: HTMLElement) {
        this.element = element;
    }

    destroy() {
        this.config = null;
        this.doc = null;
    }

    validateField(field: string) {
        
        return host.manageDatesValidateTableNames({
            report: <PBIDesktopReport>this.doc.sourceData,
            configuration: this.config.options
        }).then(response => {

            let validationFields = {
                dateTableName: "dateTableValidation",
                dateReferenceTableName: "dateReferenceTableValidation",
                holidaysTableName: "holidaysTableValidation",
                holidaysDefinitionTableName: "holidaysDefinitionTableValidation"
            };
            let validationField = (<any>validationFields)[field];
            let status = (<any>response)[validationField];
            this.config.update(validationField, status, true);

            return <OptionValidation>{ 
                valid: status == TableValidation.Valid,
                message: i18n((<any>strings)[`tableValidation${status}`]) 
            };

        }).catch(ignore => 
            <OptionValidation>{ 
                valid: false,
                message: i18n(strings.tableValidationInvalid) 
            }
        );
    }
}