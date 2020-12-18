import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../authentication.service';
import {CameraService} from '../camera.service';
import { CameraImage } from '../models';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

	imagePath = '/assets/cactus.png'

	form: FormGroup
	imageData

	constructor(private fb: FormBuilder, private cameraSvc: CameraService, private authenticateSvc: AuthenticationService) { }


	ngOnInit(): void {
	  if (this.cameraSvc.hasImage()) {
			const img = this.cameraSvc.getImage()
			this.imageData = img.imageData
		  this.imagePath = img.imageAsDataUrl
		}
		
		this.form = this.fb.group({
      title: this.fb.control('', [ Validators.required ]),
      comments: this.fb.control('', [ Validators.required ]),
		})
		
	}

	clear() {
		this.imagePath = '/assets/cactus.png'
	}

	share() {
		// get userName and password from service
		let data = this.authenticateSvc.getUserNameAndPassword()
		// console.log('username from main page >>> ', data[0]) // can log

		let username = data[0]
		let password = data[1]
		// console.log(username) // can log
		// console.log(password) // can log

		let formData = new FormData();
		formData.set('title', this.form.get('title').value)
		formData.set('comments', this.form.get('comments').value)
		formData.set('username', username)
		formData.set('password', password)
		formData.set('image', this.imageData)
		
		console.log(formData.get('image')) // can log
		console.log('formData >>> ', formData)
	}
}
