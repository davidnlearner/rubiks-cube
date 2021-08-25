import '../css/App.css';
import Cube from './Cube';

import { useEffect, useRef } from 'react';

import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


function App() {

  return (
    <div className="App">
      <Cube />
    </div>
  );
}

export default App;
