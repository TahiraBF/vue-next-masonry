/* eslint-disable operator-linebreak */
import {
   defineComponent,
   h as createElement,
   ref,
   nextTick,
   onMounted,
   onUpdated,
   onBeforeUnmount
} from 'vue';
import type { SlotWrapper } from './types';
import { breakpointValue } from './helpers';
import props from './props';

export default defineComponent({
   props,
   // eslint-disable-next-line @typescript-eslint/no-shadow
   setup(props, { slots }) {
      const displayColumns = ref(2);
      const displayGutter = ref(0);
      const wrapperWidth = ref(0);

      function calculateGutterSize(width: number) {
         displayGutter.value = breakpointValue(props.gutter, width);
      }

      function calculateColumnCount(width: number) {
         let columnLength = breakpointValue(props.cols, width) || 0;

         // Make sure we can return a valid value
         columnLength = Math.max(1, Number(columnLength));

         displayColumns.value = columnLength;
      }

      // Recalculate how many columns to display based on window width
      // and the value of the passed `:cols=` prop
      function reCalculate() {
         const windowWidth = window?.innerWidth || Infinity;

         // Window resize events get triggered on page height
         // change which when loading the page can result in multiple
         // needless calculations. We prevent this here.
         if (wrapperWidth.value !== windowWidth) {
            wrapperWidth.value = windowWidth;

            calculateColumnCount(wrapperWidth.value);
            calculateGutterSize(wrapperWidth.value);
         }
      }

      function getChildItemsInColumnsArray() {
         const columns: any = [];
         const slot = slots.default?.() as SlotWrapper;
         let children = [];

         if (slot.length > 1) {
            children = slot;
         } else {
            children = slot[0].children as any[];

            if (children.length === 1 && props.resolveSlot) {
               children = children[0]?.children || [];
            }
         }

         if (children.length === 0) return [];

         // Loop through child elements
         for (
            let i = 0, visibleItemI = 0;
            i < children.length;
            i++, visibleItemI++
         ) {
            if (!children[i].type) visibleItemI--;

            const columnIndex = visibleItemI % displayColumns.value;

            if (!columns[columnIndex]) {
               columns[columnIndex] = [];
            }

            columns[columnIndex].push(children[i]);
         }

         return columns;
      }

      function render() {
         const columnsContainingChildren = getChildItemsInColumnsArray();
         const isGutterSizeUnitless =
            parseInt(displayGutter.value.toString(), 10) ===
            displayGutter.value * 1;
         const gutterSize = isGutterSizeUnitless
            ? `${displayGutter.value}px`
            : displayGutter.value;

         const containerStyle = {
            style: {
               display: ['-webkit-box', '-ms-flexbox', 'flex'],
               marginLeft: `-${gutterSize}`
            }
         };

         const columnStyle = {
            boxSizing: 'border-box',
            backgroundClip: 'padding-box',
            width: `${100 / displayColumns.value}%`,
            border: '0 solid transparent',
            borderLeftWidth: gutterSize
         };

         const columns = columnsContainingChildren.map(
            (children: any, index: number) => {
               const config = {
                  key: `${index}-${columnsContainingChildren.length}`,
                  style: props.css ? columnStyle : null,
                  class: props.columnClass,
                  attrs: props.columnAttr
               };
               // Create column element and inject the children
               return createElement(props.columnTag, config, children);
            }
         );

         // Return wrapper with columns
         // @ts-ignore
         return createElement(props.tag, props.css && containerStyle, columns);
      }

      onMounted(() => {
         if (window) {
            window.addEventListener('resize', reCalculate);
         }
         nextTick(() => {
            reCalculate();
         });
      });

      onUpdated(() => {
         nextTick(() => {
            reCalculate();
         });
      });

      onBeforeUnmount(() => {
         if (window) {
            window.removeEventListener('resize', reCalculate);
         }
      });

      return () => render();
   }
});
