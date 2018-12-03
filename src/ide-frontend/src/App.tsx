import * as React from "react";

import AceEditor from "react-ace";
import Renderer from "react-renderer";
import { Grid, Cell } from "styled-css-grid";
import logo from "./logo.svg";
import venn from "./venn.svg";
import play from "./play.svg";
import reload from "./reload.svg";
import chevronDown from "./chevron_down.svg";
import download from "./download.svg";
import Log from "Log";
import Button from "Button";
import Dropdown, { IOption } from "Dropdown";
import { Menu, MenuList, MenuButton, MenuItem } from "@reach/menu-button";
import { Persist } from "react-persist";
import styled from "styled-components";
const socketAddress = "ws://localhost:9160";

/* 
  DEBUG NOTES:
    If you don't want the localStorage to set text box contents,
    remove the <Persist> Element
*/

const MenuBtn = styled(MenuButton)`
  background: none;
  border: none;
  opacity: 0.8;
  transition: 0.2s;
  cursor: pointer;
  :hover {
    opacity: 1;
    transition: 0.2s;
  }
  :focus {
    outline: none;
    opacity: 1;
  }
`;
interface IState {
  code: string;
  initialCode: string;
  rendered: boolean;
  selectedElement: IOption;
  selectedStyle: IOption;
  debug: boolean;
}

const elementOptions = [
  { value: 0, label: "set theory", icon: venn },
  { value: 1, label: "linear algebra", icon: logo },
  { value: 2, label: "real analysis", icon: logo }
];

const styleOptions = [{ value: 0, label: "venn", icon: venn }];
class App extends React.Component<any, IState> {
  public state = {
    code: "AutoLabel All\n",
    initialCode: "AutoLabel All\n",
    rendered: false,
    selectedElement: elementOptions[0],
    selectedStyle: styleOptions[0],
    debug: false
  };
  public ws: any = null;
  public readonly renderer = React.createRef<Renderer>();
  constructor(props: any) {
    super(props);
    Log.info("Connecting to socket...");
    this.setupSockets();
  }
  public download = () => {
    if (this.renderer.current !== null) {
      this.renderer.current.download();
    }
  };
  public autostep = () => {
    if (this.renderer.current !== null) {
      this.renderer.current.autoStepToggle();
    }
  };
  public step = () => {
    if (this.renderer.current !== null) {
      this.renderer.current.step();
    }
  };
  public resample = () => {
    if (this.renderer.current !== null) {
      this.renderer.current.resample();
    }
  };
  public setupSockets = () => {
    this.ws = new WebSocket(socketAddress);
    this.ws.onmessage = this.onMessage;
    this.ws.onclose = this.setupSockets;
  };
  public onMessage = (e: MessageEvent) => {
    if (this.renderer.current !== null) {
      this.renderer.current.onMessage(e);
      const data = JSON.parse(e.data);
      Log.info("Received data from the server.", data);
      this.setState({ rendered: true });
    } else {
      Log.error("Renderer is null.");
    }
  };
  public compile = async () => {
    const packet = { tag: "Edit", contents: { program: this.state.code } };
    this.ws.send(JSON.stringify(packet));
    this.setState({ initialCode: this.state.code });
    if (this.renderer.current !== null) {
      this.renderer.current.turnOffAutostep();
    }
  };
  public onChangeCode = (value: string) => {
    this.setState({ code: value });
  };
  public selectedElement = (value: IOption) => {
    this.setState({ selectedElement: value });
  };
  public selectedStyle = (value: IOption) => {
    this.setState({ selectedStyle: value });
  };
  public toggleDebug = () => {
    this.setState({ debug: !this.state.debug });
  };
  public render() {
    const {
      code,
      initialCode,
      rendered,
      selectedElement,
      selectedStyle,
      debug
    } = this.state;
    const autostepStatus = this.renderer.current
      ? this.renderer.current.state.autostep
      : false;
    return (
      <Grid
        style={{ height: "100vh", backgroundColor: "#EDF8FF" }}
        columns={2}
        rows={"minmax(70px, auto) 1fr "}
        gap="0"
        rowGap="0"
        columnGap={"5px"}
      >
        <Persist
          name="debugMode"
          data={debug}
          debounce={0}
          onMount={data => this.setState({ debug: data })}
        />
        <Persist
          name="savedContents"
          data={code}
          debounce={200}
          onMount={data => this.setState({ code: data })}
        />
        <Cell
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            padding: "0 0.2em 0 0.5em"
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Menu>
              <MenuBtn>
                <img src={logo} width={50} aria-labelledby="Main Menu" />
                <img src={chevronDown} />
              </MenuBtn>
              <MenuList>
                <MenuItem onSelect={this.toggleDebug}>
                  Turn {debug ? "off" : "on"} debug mode
                </MenuItem>
              </MenuList>
            </Menu>

            <Dropdown
              options={elementOptions}
              selected={selectedElement}
              onSelect={this.selectedElement}
            />
          </div>
          <Button
            label={"build"}
            leftIcon={play}
            onClick={this.compile}
            primary={true}
            disabled={code === initialCode}
          />
        </Cell>
        <Cell
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            padding: "0 0.2em 0 0.5em"
          }}
        >
          <Dropdown
            options={styleOptions}
            selected={selectedStyle}
            onSelect={this.selectedStyle}
          />
          {debug && <Button label="step" onClick={this.step} />}
        </Cell>
        <Cell>
          <AceEditor
            width="100%"
            height="100%"
            style={{ zIndex: 0 }}
            fontSize={20}
            onChange={this.onChangeCode}
            value={code}
          />
        </Cell>
        <Cell style={{ backgroundColor: "#FBFBFB" }}>
          <Renderer ws={this.ws} ref={this.renderer} customButtons={true} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              label="resample"
              leftIcon={reload}
              onClick={this.resample}
              primary={true}
              disabled={!rendered}
            />
            <Button
              label={autostepStatus ? "autostep (on)" : "autostep (off)"}
              onClick={this.autostep}
            />
            <Button
              leftIcon={download}
              label="download"
              onClick={this.download}
              disabled={!rendered}
            />
          </div>
        </Cell>
      </Grid>
    );
  }
}

export default App;