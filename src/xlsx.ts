import { saveAs } from 'file-saver';
import uzip from 'uzip';

import Sheet from './sheet';
import Style, { StyleConfig } from './style';
import Font from './style/font';
import Fill from './style/fill';
import Border from './style/border';
import { jsonToXml } from './utils';

export interface StyleElements {
  fonts: Font[];
  fills: Fill[];
  borders: Border[];
}

export default class XLSX {
  sheets: Sheet[] = [];
  styles: Style[] = [];
  styleElements: StyleElements = {
    fonts: [],
    fills: [],
    borders: [new Border({})],
  };

  constructor() {
    this.style({
      fontFamily: 'Arial',
      backgroundColor: 'none',
    });
    this.style({
      backgroundColor: 'none',
    });
  }

  sheet(name: string): Sheet {
    const sheet = new Sheet(this, name);
    this.sheets.push(sheet);
    return sheet;
  }

  style(config: StyleConfig): Style {
    const style = new Style(config, this.styles.length, this.styleElements);
    this.styles.push(style);
    return style;
  }

  getBlob(): Blob {
    const encoder = new TextEncoder();
    const obj = {
      ['[Content_Types].xml']: Uint8Array.from(
        encoder.encode(
          jsonToXml({
            _t: 'Types',
            xmlns:
              'http://schemas.openxmlformats.org/package/2006/content-types',
            _c: [
              {
                _t: 'Default',
                Extension: 'rels',
                ContentType:
                  'application/vnd.openxmlformats-package.relationships+xml',
              },
              {
                _t: 'Override',
                PartName: '/xl/workbook.xml',
                ContentType:
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
              },
              {
                _t: 'Override',
                PartName: '/xl/styles.xml',
                ContentType:
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
              },
              ...this.sheets.map((sheet, index) => ({
                _t: 'Override',
                PartName: `/xl/worksheets/sheet${index + 1}.xml`,
                ContentType:
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
              })),
            ],
          })
        )
      ),
      ['_rels/.rels']: Uint8Array.from(
        encoder.encode(
          jsonToXml({
            _t: 'Relationships',
            xmlns:
              'http://schemas.openxmlformats.org/package/2006/relationships',
            _c: [
              {
                _t: 'Relationship',
                Id: 'rId1',
                Type:
                  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
                Target: 'xl/workbook.xml',
              },
            ],
          })
        )
      ),
      ['xl/workbook.xml']: Uint8Array.from(
        encoder.encode(
          jsonToXml({
            _t: 'workbook',
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            'xmlns:r':
              'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            _c: [
              {
                _t: 'sheets',
                _c: this.sheets.map((sheet, index) => ({
                  _t: 'sheet',
                  name: sheet.name,
                  sheetId: (index + 1).toString(),
                  'r:id': `rId${index + 2}`,
                })),
              },
            ],
          })
        )
      ),
      ['xl/_rels/workbook.xml.rels']: Uint8Array.from(
        encoder.encode(
          jsonToXml({
            _t: 'Relationships',
            xmlns:
              'http://schemas.openxmlformats.org/package/2006/relationships',
            _c: [
              {
                _t: 'Relationship',
                Id: 'rId1',
                Type:
                  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
                Target: 'styles.xml',
              },
              ...this.sheets.map((sheet, index) => ({
                _t: 'Relationship',
                Id: `rId${index + 2}`,
                Type:
                  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
                Target: `worksheets/sheet${index + 1}.xml`,
              })),
            ],
          })
        )
      ),
      ['xl/styles.xml']: Uint8Array.from(
        encoder.encode(
          jsonToXml({
            _t: 'styleSheet',
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            'xmlns:x14ac':
              'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
            'xmlns:mc':
              'http://schemas.openxmlformats.org/markup-compatibility/2006',
            _c: [
              {
                _t: 'fonts',
                count: this.styleElements.fonts.length,
                _c: this.styleElements.fonts.map(font => font.export()),
              },
              {
                _t: 'fills',
                count: this.styleElements.fills.length,
                _c: this.styleElements.fills.map(fill => fill.export()),
              },
              {
                _t: 'borders',
                count: this.styleElements.borders.length,
                _c: this.styleElements.borders.map(border => border.export()),
              },
              {
                _t: 'cellXfs',
                count: this.styles.length,
                _c: this.styles.map(style => style.export()),
              },
            ],
          })
        )
      ),
    };
    for (let i = 0; i < this.sheets.length; i++) {
      obj[`xl/worksheets/sheet${i + 1}.xml`] = Uint8Array.from(
        encoder.encode(this.sheets[i].export())
      );
    }

    return new Blob([uzip.encode(obj)]);
  }

  save(filename: string): void {
    const blob = this.getBlob();
    saveAs(blob, filename);
  }
}
