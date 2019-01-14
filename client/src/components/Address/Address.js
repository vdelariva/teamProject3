import React from "react";
import "./Address.css";

const Address = props => (
  <div className="address">
    <h3 className="text-center">{props.title}</h3>
    {props.locationName ? 
    <p className="text-center">
      <b>{props.locationName}:<br /> </b> 
      {props.line1}<br />
      {props.city} {props.state} {props.zip}</p>
    : 
      <p className="text-center" >{props.msg}</p>}
  </div>
);

export default Address;