import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { MaskEditor, MaskEditorProps } from "./maskEditor";
import { toMask } from "./utils";
const icon = require("./icon.png");
const cat = require("./cat.jpg");

export default {
  component: MaskEditor,
  title: "Mask Editor",
} as ComponentMeta<typeof MaskEditor>;

const Template: ComponentStory<typeof MaskEditor> = (args: MaskEditorProps) => {
  const [size, setSize] = React.useState(10);
  const canvas = React.useRef<HTMLCanvasElement>();
  const [mask, setMask] = React.useState("");
  return (
    <>
      <MaskEditor
        {...args}
        cursorSize={size}
        onCursorSizeChange={setSize}
        canvasRef={canvas}
      />
      <button onClick={() => setMask(toMask(canvas.current))}>
        Extract Mask
      </button>
      <img src={mask} style={{ border: "1px solid gray" }} />
    </>
  );
};

export const BareEditorStory = Template.bind({});
BareEditorStory.args = {
  src: icon,
  maskColor: "#ffffff",
};
BareEditorStory.storyName = "Default";

export const CatEditorStory = Template.bind({});
CatEditorStory.args = {
  src: cat,
  maskColor: "#ffffff",
};
CatEditorStory.storyName = "Non square image";
