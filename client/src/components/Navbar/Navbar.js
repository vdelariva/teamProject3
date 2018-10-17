import React from "react";
import "./NavBar.css";
import { Navbar, Nav, NavItem, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

//const NavBar = () => (
class NavBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: false,
      user: ""
    }
  };

  logout = (event) => {
    event.preventDefault();
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("firstName");
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("_id");
    window.location="/";
  };
  <Navbar fluid inverse fixedTop>
  <Navbar.Header>
    <Navbar.Brand>
      <a href="/">VOTE NOW</a>
    </Navbar.Brand>
    <Navbar.Toggle />
  </Navbar.Header>
  
  {/* <Navbar.Collapse>
    <Nav>
      <NavItem eventKey={1} href="/" className="navlink">
        Home
      </NavItem>
    </Nav> */}

  render() {
    return (<Navbar fluid inverse fixedTop>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="/">VOTE NOW</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>

      <Navbar.Collapse>
        <Navbar.Form pullRight>
          <span className="loginUser">
            {this.props.loggedIn ? `Hi ${this.props.userName}!` : null}
          </span>

          {this.props.loggedIn && this.props.userName 
          ? (<Link to="/">
            <Button bsStyle="danger" onClick={this.logout}>Sign Out</Button>
          </Link> 
          ): (<Link to="/login">
              <Button bsStyle="danger">Sign In</Button>
          </Link>)}
        </Navbar.Form>

      </Navbar.Collapse>
    </Navbar>
    )
  }

};
export default NavBar;
