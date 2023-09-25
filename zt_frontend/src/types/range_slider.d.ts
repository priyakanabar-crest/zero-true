/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Unique id for a component
 */
export type Id = string;
/**
 * Optional variable name associated with a component
 */
export type VariableName = string;
export type Row = number | null;
export type Column = number | null;
export type Colwidth = number | null;
/**
 * Vue component name.
 */
export type Component = string;
/**
 * Current value range of the slider.
 */
export type Value = number[];
/**
 * Minimum value of the slider.
 */
export type Min = number;
/**
 * Maximum value of the slider.
 */
export type Max = number;
/**
 * Step increment of the slider.
 */
export type Step = number;
/**
 * Displays the thumb label.
 */
export type ThumbLabel = boolean;
/**
 * Size of the thumb.
 */
export type ThumbSize = number;
/**
 * Displays the tick labels.
 */
export type TickLabels = boolean;
/**
 * Displays the ticks.
 */
export type Ticks = unknown[];
/**
 * Color of the range slider. Can be custom or standard Material color.
 */
export type Color = string;
/**
 * Size of the slider.
 */
export type Size = string;
/**
 * A label for your slider
 */
export type Label = string | null;
/**
 * Determines if the slider has rounded edges.
 */
export type Rounded = boolean;
/**
 * Trigger event for when to run the slider
 */
export type Triggerevent = string;

/**
 * A range slider component that allows you to capture numeric input from a user.
 *
 * To use the slider simply import the package and then declare the slider. The only required
 * field is an id. Your slider will render with default max and min values and a number
 * of other defaults.
 */
export interface RangeSlider {
  id: Id;
  variable_name?: VariableName;
  row?: Row;
  column?: Column;
  colWidth?: Colwidth;
  component?: Component;
  value?: Value;
  min?: Min;
  max?: Max;
  step?: Step;
  thumb_label?: ThumbLabel;
  thumb_size?: ThumbSize;
  tick_labels?: TickLabels;
  ticks?: Ticks;
  color?: Color;
  size?: Size;
  label?: Label;
  rounded?: Rounded;
  triggerEvent?: Triggerevent;
  [k: string]: unknown;
}