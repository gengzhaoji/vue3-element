import DirectEditingModule from 'diagram-js-direct-editing';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import SelectionModule from 'diagram-js/lib/features/selection';
import ConnectModule from 'diagram-js/lib/features/connect';
import CreateModule from 'diagram-js/lib/features/create';
import PopupMenuModule from '../popup-menu';

import CustomContextPadProvider from './CustomContextPadProvider';
import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider'

export default {
    __depends__: [
        DirectEditingModule,
        ContextPadModule,
        SelectionModule,
        ConnectModule,
        CreateModule,
        PopupMenuModule
    ],
    __init__: [ 'contextPadProvider' ],
    contextPadProvider: [ 'type', CustomContextPadProvider ]
};