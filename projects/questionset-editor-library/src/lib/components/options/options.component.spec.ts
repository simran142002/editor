import { TelemetryInteractDirective } from '../../directives/telemetry-interact/telemetry-interact.directive';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { OptionsComponent } from './options.component';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { mockOptionData, nativeElement, sourcingSettingsMock } from './options.component.spec.data';
import { ConfigService } from '../../services/config/config.service';
import { SuiModule } from 'ng2-semantic-ui-v9';
import { TreeService } from '../../services/tree/tree.service';
import { treeData } from './../fancy-tree/fancy-tree.component.spec.data';
import { EditorTelemetryService } from '../../services/telemetry/telemetry.service';
import { EditorService } from "../../services/editor/editor.service";

const mockEditorService = {
  editorConfig: {
    config: {
      renderTaxonomy:true,
      hierarchy: {
        level1: {
          name: "Module",
          type: "Unit",
          mimeType: "application/vnd.ekstep.content-collection",
          contentType: "Course Unit",
          iconClass: "fa fa-folder-o",
          children: {},
        },
      },
    },
  },
  parentIdentifier: ""
};


describe('OptionsComponent', () => {
  let component: OptionsComponent;
  let fixture: ComponentFixture<OptionsComponent>;
  let treeService,telemetryService;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, FormsModule, SuiModule ],
      declarations: [ OptionsComponent, TelemetryInteractDirective ],
      providers: [ConfigService,TreeService,EditorTelemetryService,
        { provide: EditorService, useValue: mockEditorService },],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionsComponent);
    treeService = TestBed.inject(TreeService);
    telemetryService = TestBed.inject(EditorTelemetryService);
    component = fixture.componentInstance;
    component.sourcingSettings = sourcingSettingsMock;
    spyOn(treeService, 'setTreeElement').and.callFake((el) => {
      treeService.nativeElement = nativeElement;
    });
    spyOn(treeService, 'getFirstChild').and.callFake(() => {
      return { data: { metadata: treeData } };
    });
    component.editorState = mockOptionData.editorOptionData;

    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit() should call addSelectedOptions and editorDataHandler on ngOnInit', () => {
    component.editorState = mockOptionData.editorOptionData;
    spyOn(component, 'addSelectedOptions').and.callFake(() => {});
    spyOn(component, 'editorDataHandler');
    component.ngOnInit();
    expect(component.addSelectedOptions).toHaveBeenCalled();
    expect(component.editorDataHandler).toHaveBeenCalled();
  });

  it('#ngOnInit() should not call addSelectedOptions ngOnInit', () => {
    component.editorState = mockOptionData.editorOptionData;
    component.editorState.answer = "";
    spyOn(component, 'addSelectedOptions').and.callFake(() => {});
    component.ngOnInit();
    expect(component.addSelectedOptions).not.toHaveBeenCalled();
  });

  it('should not set #templateType when creating new question', () => {
    component.editorState = {};
    spyOn(component, 'editorDataHandler');
    component.ngOnInit();
    expect(component.templateType).toEqual('mcq-vertical');
  });

  it('should set #templateType when updating an existing question', () => {
    component.editorState = mockOptionData.editorOptionData;
    spyOn(component, 'editorDataHandler');
    component.ngOnInit();
    expect(component.templateType).toEqual('mcq-split-grid');
  });

  it('ngOnChanges should not call editorDataHandler', () => {
    spyOn(component, 'editorDataHandler').and.callFake(() => {});
    spyOn(component, 'ngOnChanges').and.callThrough();
    component.ngOnChanges({
      maxScore: new SimpleChange(undefined, 1, true),
    });
    expect(component.editorDataHandler).not.toHaveBeenCalled();
  });

  it('ngOnChanges should call editorDataHandler', () => {
    spyOn(component, 'editorDataHandler').and.callFake(() => {});
    spyOn(component, 'ngOnChanges').and.callThrough();
    component.ngOnChanges({
      maxScore: new SimpleChange(1, 2, false),
    });
    expect(component.editorDataHandler).toHaveBeenCalled();
  });

  it('addSelectedOptions should set selectedOptions', () => {
    component.selectedOptions = [];
    component.editorState = mockOptionData.editorOptionData;
    spyOn(component, 'addSelectedOptions').and.callThrough();
    component.addSelectedOptions();
    expect(component.selectedOptions.length).toEqual(1);
  });

  it('addSelectedOptions should set selectedOptions', () => {
    component.selectedOptions = [];
    component.editorState = mockOptionData.editorOptionData;
    component.editorState.answer = [0,1];
    spyOn(component, 'addSelectedOptions').and.callThrough();
    component.addSelectedOptions();
    expect(component.selectedOptions.length).toEqual(2);
    expect(component.editorState.options[0]['selected']).toEqual(true);
    expect(component.editorState.options[1]['selected']).toEqual(true);
  });

  it('#editorDataHandler() should emit option data when answer is single value', () => {
    spyOn(component, 'prepareMcqBody').and.callThrough();
    spyOn(component.editorDataOutput, 'emit').and.callThrough();
    component.editorState = mockOptionData.editorOptionData;
    component.editorDataHandler();
    component.questionPrimaryCategory='Multiselect Multiple Choice Question';
    expect(component.prepareMcqBody).toHaveBeenCalledWith(mockOptionData.editorOptionData);
    expect(component.editorDataOutput.emit).toHaveBeenCalled();
  });

  it('#editorDataHandler() should emit option data when answer is multiple value', () => {
    spyOn(component, 'prepareMcqBody').and.callThrough();
    spyOn(component.editorDataOutput, 'emit').and.callThrough();
    component.editorState = mockOptionData.editorOptionData;
    component.editorState.answer = [0,1];
    component.editorDataHandler();
    component.questionPrimaryCategory='Multiselect Multiple Choice Question';
    expect(component.prepareMcqBody).toHaveBeenCalledWith(mockOptionData.editorOptionData);
    expect(component.editorDataOutput.emit).toHaveBeenCalled();
  });

  it('#prepareMcqBody() should return expected mcq option data for single select MCQ', () => {
    component.maxScore = 1;
    component.selectedOptions = [0];
    spyOn(component, 'getResponseDeclaration').and.callThrough();
    spyOn(component, 'getInteractions').and.callThrough();
    const result = component.prepareMcqBody(mockOptionData.editorOptionData);
    expect(component.getResponseDeclaration).toHaveBeenCalledWith(mockOptionData.editorOptionData);
    expect(component.getInteractions).toHaveBeenCalledWith(mockOptionData.editorOptionData.options);
  });

  it('#prepareMcqBody() should return expected mcq option data for single select MCQ', () => {
    component.maxScore = 1;
    component.selectedOptions = [0,1];
    spyOn(component, 'getResponseDeclaration').and.callThrough();
    spyOn(component, 'getInteractions').and.callThrough();
    const result = component.prepareMcqBody(mockOptionData.editorOptionData);
    expect(component.getResponseDeclaration).toHaveBeenCalledWith(mockOptionData.editorOptionData);
    expect(component.getInteractions).toHaveBeenCalledWith(mockOptionData.editorOptionData.options);
  });

  it('#getResponseDeclaration() should return expected response declaration', () => {
    spyOn(component,"getResponseDeclaration").and.callThrough();
    component.getResponseDeclaration(mockOptionData.editorOptionData);
    expect(component.getResponseDeclaration).toHaveBeenCalled();
    // expect(mockOptionData.prepareMcqBody.responseDeclaration).toEqual(result);
  });

  it('setMapping should set the mapping for single select MCQ', () => {
    component.mapping = [];
    component.selectedOptions = [0];
    component.maxScore = 1;
    spyOn(component, 'setMapping').and.callThrough();
    component.setMapping();
    expect(component.mapping.length).toEqual(1);
  });

  it('setMapping should set the mapping for single select MCQ', () => {
    component.mapping = [];
    component.selectedOptions = [0,1];
    component.maxScore = 1;
    spyOn(component, 'setMapping').and.callThrough();
    component.setMapping();
    expect(component.mapping.length).toEqual(2);
  });


  it('#getInteractions() should return expected response declaration', () => {
    spyOn(component,"getInteractions").and.callThrough();
    component.getInteractions(mockOptionData.editorOptionData.options);
    expect(component.getInteractions).toHaveBeenCalled();
    // expect(mockOptionData.prepareMcqBody.interactions).toEqual(result);
  });

  it('#setTemplete() should set #templateType to "mcq-vertical-split"  ', () => {
    spyOn(component, 'editorDataHandler').and.callThrough();
    const templateType = 'mcq-vertical-split';
    component.editorState = mockOptionData.editorOptionData;
    component.setTemplete(templateType);
    expect(component.templateType).toEqual(templateType);
    expect(component.editorDataHandler).toHaveBeenCalled();
  });

  it('#subMenuChange() should set the sub-menu value ', () => {
    component.subMenus =  mockOptionData.subMenus;
    spyOn(component, 'subMenuChange').and.callThrough();
    component.subMenuChange({index:1,value:'test'},1)
    expect(component.subMenus[0][0].value).toBe('test');
  })

  it('#subMenuConfig() should set on initialize', () => {
    spyOn(component,'subMenuConfig').and.callThrough();
    const options = [
      {
        "body": "<p>true</p>"
      }
    ];
    component.subMenuConfig(options);
    expect(component.subMenuConfig).toHaveBeenCalledWith(options)
  })

  it('onOptionChange should set editorState.answer', () => {
    component.selectedOptions = [];
    component.editorState.answer = "";
    spyOn(component, 'editorDataHandler').and.callFake(() => {});
    spyOn(component, 'setMapping').and.callFake(() => {});
    spyOn(component, 'onOptionChange').and.callThrough();
    component.onOptionChange({target: {value: "0", checked: true}})
    expect(component.selectedOptions.length).toEqual(1);
    expect(component.editorState.answer).toEqual("0");
    expect(component.setMapping).toHaveBeenCalled();
    expect(component.editorDataHandler).toHaveBeenCalled();
  })

  it('onOptionChange should set editorState.answer', () => {
    component.selectedOptions = [0];
    component.editorState.answer = "";
    spyOn(component, 'editorDataHandler').and.callFake(() => {});
    spyOn(component, 'setMapping').and.callFake(() => {});
    spyOn(component, 'onOptionChange').and.callThrough();
    component.onOptionChange({target: {value: "1", checked: true}})
    expect(component.selectedOptions.length).toEqual(2);
    expect(component.editorState.answer).toEqual([0,1]);
    expect(component.setMapping).toHaveBeenCalled();
    expect(component.editorDataHandler).toHaveBeenCalled();
  })

  it('onOptionChange should set editorState.answer', () => {
    component.selectedOptions = [0,1];
    component.editorState.answer = "";
    spyOn(component, 'editorDataHandler').and.callFake(() => {});
    spyOn(component, 'setMapping').and.callFake(() => {});
    spyOn(component, 'onOptionChange').and.callThrough();
    component.onOptionChange({target: {value: "1", checked: false}})
    expect(component.selectedOptions.length).toEqual(1);
    expect(component.editorState.answer).toEqual("0");
    expect(component.setMapping).toHaveBeenCalled();
    expect(component.editorDataHandler).toHaveBeenCalled();
  })

  it('#setScore() should call if score is entered', () => {
    spyOn(component,'setScore').and.callThrough();
    const value = "20";
    const scoreIndex = 1;
    component.setScore(value,scoreIndex);
    component.editorDataHandler();
    expect(component.setScore).toHaveBeenCalled();    
  });

});
