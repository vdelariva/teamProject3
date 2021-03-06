import React, { Component } from "react";
import API from "../utils/API";
import Address from "../components/Address";
import SearchForm from "../components/SearchForm";
import Candidate from "../components/Candidate";
import Podcast from "../components/Podcast";
import SavedPodcasts from "../components/SavedPodcasts";
import NavBar from "../components/NavBar";
import {Row, Col, Button} from "react-bootstrap";
import './Home.css';

class Home extends Component {
  stageId = "G"; // Set to General Election
  username = "";
  electionYear = 2018;
  _id = "0"; // Can not be null
  candidates = [];
  uniqueDistricts;

  state = {
    username: "",
    firstName: "",
    lastName: "",

    line1: "",
    city: "",
    state: "",
    zip: "",

    plocationName: "",
    pline1: "",
    pcity: "",
    pstate: "",
    pzip: "",

    loggedIn:false,
    message: "",
    podcasts: [],
    savedPodcasts: [],

    contests: [], // from google civic
    contest: [], //  Used to pass subset of contests (i.e. Senate race) to Candidates component
    officeId: "6" // Default to Senator
  }

  componentDidMount() {
    this._id = window.sessionStorage.getItem("_id");
    this.loadVoter()
    .then(res => this.getInfo())
  }

  componentDidUpdate() {
    this.username = window.sessionStorage.getItem("username");
    if (this.username && !this.state.username) {
      this.setState({username:this.username})
      this.setState({loggedIn:true})
      this._id = window.sessionStorage.getItem("_id");
    }
  }

  // API Methods
  
  callCivic = () => {
    const address = `${this.state.line1} ${this.state.city} ${this.state.state} ${this.state.zip}`
    // Get polling location address
    API.apiCivic(address)
      .then(res => {
        if (res.data.hasOwnProperty("pollingLocations")) {
          // Save polling address to state
          this.setState({
            plocationName: res.data.pollingLocations[0].address.locationName,
            pline1: res.data.pollingLocations[0].address.line1,
            pcity: res.data.pollingLocations[0].address.city,
            pstate: res.data.pollingLocations[0].address.state,
            pzip: res.data.pollingLocations[0].address.zip,
            contests: res.data.contests
          })
        }
        else {
          console.log("Polling location not available")
        }
      })
      .catch(err => console.log(err));
  };

  callListenNotes = event => {
    API.apiListenNotes()
    .then(result => {
      console.log(`Listen Notes result: `, result)
      this.setState({podcasts:result.data.results},()=> {
        window.location.href = window.location.href+'#newPodcasts'
      })
    })
    .catch(err => console.log(err));
  };

  callVoteSmart = (query) => {
    return API.apiVoteSmart(query)
  };

  // Voter Candidate/Polling Methods

  // Return an array of candidates for a specific contest (i.e. Senate) - Used with Google Civic API
  filterByContest = (contest) => {
    return ( contest.office.indexOf( this.state.contest ) > -1 )
  }

  // Return an array of candidates for a specific contest (i.e. Senate) - Used with VoteSmart API
  filterByOfficeId = (contest) => {
    return (contest.electionOfficeId === this.state.officeId)
  }

  // Get candidates by zip code from VoteSmart API
  getCandidates = (zip, stageId, electionYear) => {
    const query = {
      command: "Candidates.getByZip",
      params: { zip5: zip, stageId: stageId, electionYear: electionYear }
    }
    return this.callVoteSmart(query)
  }

  // Get Candidate Bio using VoteSmart API
  getCandidateBio = (candidateId) => {
    const query = {
      command: "CandidateBio.getBio",
      params: { candidateId: candidateId }
    }
    return this.callVoteSmart(query)
  }

  // Get candidates by office - display an individual contest - used with VoteSmart API
  getCandidateByOffice = () => {
    const arr = this.candidates.filter(this.filterByOfficeId)
    if (arr.length) {
      this.getDistrictIds(arr);
      this.setState({contest:arr});
      this.setState({message: ""}); // Clear message
    }
    else {
      this.setState({ message: `Contest not on ballot` });
      this.setState({contest: []}) // Clear contest array
    }
  }

  // Get a list of individual elections by district
  // Return an array with unique Office Ids (in a district there may be 2 contest i.e. 2 Senate Races)
  getDistrictIds = (contest) => {
    const districts = contest.map(district => {
      return (district.electionDistrictId)
    })
    // Remove duplicates from array
    this.uniqueDistricts = this.arrayUnique(districts);
  }

  // Get polling & candidate info
  getInfo = () => {
    this.callCivic();
    this.getCandidates(this.state.zip, this.stageId, this.electionYear)
    .then(res => {
      if (res.data.candidateList.candidate.length) {
        this.parseCandidates(res.data.candidateList.candidate)
      }
    })
  }

  // Parse response from VoteSmart API into object
  parseCandidates = (candidates) => {
    let pCandidates = candidates.map(candidate => {
      return this.getCandidateBio(candidate.candidateId)
        .then(res => {
          const candidateObj = {
            candidateId: candidate.candidateId,
            ballotName: candidate.ballotName,
            electionParties: candidate.electionParties,
            electionDistrictId: candidate.electionDistrictId,
            electionDistrictName: candidate.electionDistrictName,
            electionOffice: candidate.electionOffice,
            electionOfficeId: candidate.electionOfficeId,
            electionStateId: candidate.electionStateId,
            electionDate: candidate.electionDate,
            runningMateId: candidate.runningMateId,
            runningMateName: candidate.runningMateName,
            birthDate: res.data.bio.candidate.birthDate,
            birthPlace: res.data.bio.candidate.birthPlace,
            family: res.data.bio.candidate.family,
            homeCity: res.data.bio.candidate.homeCity,
            homeState: res.data.bio.candidate.homeState,
            religion: res.data.bio.candidate.religion,
            photo: res.data.bio.candidate.photo
          }
          return candidateObj
        })
    })
    return Promise.all(pCandidates).then(data => {
      // Remove duplicates & save the candidate list to local variable
      this.candidates = data.filter((object,index) => index === data.findIndex(obj => JSON.stringify(obj) === JSON.stringify(object)));
      this.getCandidateByOffice()
    })
  }

  // Google API candidate list - For future use to harvest more candidate info
  testCandidate = (event) => {
    const contestArr = this.state.contests.filter(this.filterByContest)
    console.log(`contestArr: `, contestArr)
  }

  // Voter/User Methods

  // Find voter by id
  getVoter = (id) => {
    return API.getVoterById(id)
  }

  // Get voter information and set state variables
  loadVoter = () => {
    return this.getVoter(this._id)
      .then(voterDB => {
        // If voter found in db, set state variables
        this.setState({
          firstName: voterDB.data.firstName,
          lastName: voterDB.data.lastName,
          line1: voterDB.data.address.line1,
          city: voterDB.data.address.city,
          state: voterDB.data.address.state,
          zip: voterDB.data.address.zip,
          savedPodcasts: voterDB.data.podcasts
        });
      
        sessionStorage.setItem('firstName', voterDB.data.firstName);
      })
  }

  // Update voter information
  updateVoter = (event) => {
    // Update voter info in db
    const voterObj = {
      name: this.state.voterName,
      address: {
        line1: this.state.line1,
        city: this.state.city,
        state: this.state.state,
        zip: this.state.zip
      }
    }
    return API.updateVoter(this._id, voterObj)
  }

  // Podcast Methods

  // Remove podcast from voter's podcast list
  removePodcast = id => {
    API.removePodcast(id,this._id)
      .then(voterDB => this.setState({savedPodcasts:voterDB.data.podcasts}))
  }

  // Save podcast to Podcasts collection, and push on to voter's list of saved podcasts
  savePodcast = podcastObj => {
    // Save podcast, pass voter._id to save to voter document
    console.log(`save podcast: `, podcastObj)
    API.savePodcast(podcastObj,this._id)
      .then(podcastDB => {
        console.log(`Save podcastDB: `, podcastDB)
        this.setState({savedPodcasts:podcastDB.data.podcasts})
      })
  }

  // Functional Methods

  // Remove duplicates from array
  arrayUnique = arr => {
    return arr.filter(function(item, index){
      return arr.indexOf(item) >= index;
    });
  };

  // Event Handlers
  
  handleInputChange = event => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    })
  }

  handleOfficeChange = event => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    },
    this.getCandidateByOffice);
  }

  handleFormSubmit = event => {
    event.preventDefault();
    this.getInfo();
  };

  render() {
    return (

      <div className="Main">
        <Row className="voteSearch">
        <NavBar loggedIn = {this.state.loggedIn} userName = {this.state.firstName}/>
        </Row>

        <Row className="voteSearch">
          <Col>
            <SearchForm 
              line1={this.state.line1}
              city={this.state.city}
              state={this.state.state}
              zip={this.state.zip}
              loggedIn={this.state.loggedIn}
              handleFormSubmit={this.handleFormSubmit}
              handleInputChange={this.handleInputChange}
              updateVoter={this.updateVoter}
            ></SearchForm>
          </Col>
        </Row>
      
        {/* Display Polling Location */}
        <Row className="pollLocation">
          <Col s={12} sm={4} md={4}>
            <Address
              title="Your Polling Place:"
              locationName={this.state.plocationName}
              line1={this.state.pline1}
              city={this.state.city}
              state={this.state.state}
              zip={this.state.zip}
              msg="Enter Your Address"
            ></Address>
          </Col>
        
          {/* Alert & Form to select election contest */}
          <Col s={12} sm={4} md={4} className="voteSearch text-center">
            {/* Alert div */}
            <div className="voteAlert">
              {this.state.message !== '' &&
                <div className="alert alert-danger alert-dismissible" role="alert">
                  {this.state.message}
                </div>
              }
            </div>
            <form>
              <h3 htmlFor="officeIdForm" className="text-center">Select Contest</h3>
              <select 
                value={this.state.officeId}
                onChange={this.handleOfficeChange}
                name="officeId"
                className="form-control text-center" id="officeIdForm"
              >
                <option value={6}>U.S. Senator</option>
                <option value={5}>U.S. Representative</option>
                <option value={3}>Governor</option>
                <option value={4}>Lt. Governor</option>
                <option value={8}>State House</option>
                <option value={12}>Attorney General</option>
                <option value={44}>Secretary of State</option>
              </select>
            </form>
          </Col>
          
          {/* Request new podcasts */}
          <Col s={12} sm={3} md={3} className="newPods">
            <h3 className="text-center">New Podcasts</h3>
            <Button
              onClick={this.callListenNotes}
              bsStyle={"danger"}
              className="center-block"
            >
              Get Podcasts
            </Button>
          </Col>
        </Row>

        {/* Display candidates for selected contest */}
        <Row>
          <Col size="12">
            {/* Render only if there are candidates */}
            { this.state.contest.length > 0 &&
              <Candidate 
                candidates={this.state.contest} 
                districts={this.uniqueDistricts} 
                name={this.state.contest[0].electionOffice}
              />
            }
          </Col>
        </Row>

        {/* Display Save Podcasts */}
        <Row className="votePodcast">
          <Col size="12">
            {/* Render only if there are saved podcasts */}
            { this.state.savedPodcasts.length > 0 &&
              <SavedPodcasts podcasts={this.state.savedPodcasts} removePodcast={this.removePodcast} />
            }
          </Col>
        </Row>

        {/* Display New Podcasts */}
        <Row className="votePodcast" id="newPodcasts">
          <Col size="12">
            {/* Render only if there are new podcasts */}
            { this.state.podcasts.length > 0 &&
              <Podcast podcasts={this.state.podcasts} savePodcast={this.savePodcast} loggedIn={this.state.loggedIn}/>
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default Home;
