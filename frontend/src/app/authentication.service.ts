import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Login } from "./models";

// import {CameraImage} from './models';

@Injectable()
export class AuthenticationService {

  username = ''
  password = ''

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  
  constructor(private http: HttpClient) { }

  async authenticateLogin(login: Login): Promise<any> {
    // console.log(login)
    this.username = login['username'] // can log
    this.password = login['password']

    return await this.http.post('/', login, this.httpOptions)
    .toPromise()
  }

  getUserNameAndPassword() {
    return [this.username, this.password]
  }

  async postToBackend(form: FormData): Promise<any> {
    // console.log('form >>> ', form) // empty because it's FormData, normal
    return await this.http.post('/postForm', form) // don't need header
      .toPromise()
  } 
}
