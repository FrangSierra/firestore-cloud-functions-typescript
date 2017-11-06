## Cloud Functions for Firebase: Typescript with Firebase Firestore

This is an example Firebase project for using
[TypeScript](https://www.typescriptlang.org/) with
[Cloud Functions for Firebase](https://firebase.google.com/products/functions)
and [Firestore](https://firebase.google.com/docs/firestore/)

# Before start

 This cloud functions represent one of my last works with cloud functions: Implement a basic social media representation
 with posts, followers and feed, together with likes and comments. What will our cloud functions control?
 - Update the feed of the users when they follow/unfollow another user
 - Send notifications and update the Events data for an user when one of their posts receive a like or comment.
 - Send notifications when we have a new follower
 - *In Progress* : Update all the denormalized data from the user when he change his profile(username or profile picture)

 I'm not an expert in noSQL data models or Typescript, but I have been working with Firebase approximately for the last two years.
 For that reason, feel free to suggest changes or just send a pull request. You can find an example of the [database structure
 in the project](https://github.com/FrangSierra/social-media-firestore-functions/blob/master/database-structure.json).

 At the moment there is not to much information or example about work with Typescript and Firestore. If you want to learn
 more I suggest you to visit the profile of [Thomas Bouldin, aka Inlined](https://github.com/inlined/alone-together) who did
 a great talk in #FirebaseSummit about write quality cloud functions with Typescript. Also don't forget to give a look to the
 [Firebase Functions samples](https://github.com/firebase/functions-samples).

### Why Firestore?

Cloud Firestore is a cloud-hosted, NoSQL database that your iOS, Android, and web apps can access directly via native SDKs.
 Cloud Firestore is also available in native Node.js, Java, Python, and Go SDKs, in addition to REST and RPC APIs.

Following Cloud Firestore's NoSQL data model, you store data in documents that contain fields mapping to values.
These documents are stored in collections, which are containers for your documents that you can use to organize your data and build queries.

Additionally, querying in Cloud Firestore is expressive, efficient, and flexible.
Create shallow queries to retrieve data at the document level without needing to retrieve the entire collection,
or any nested subcollections. Add sorting, filtering, and limits to your queries or cursors to paginate your results.
To keep data in your apps current, without retrieving your entire database each time an update happens, add realtime listeners.
Adding realtime listeners to your app notifies you with a data snapshot whenever the data your client apps are listening
to changes, retrieving only the new changes.

### Why TypeScript?

[TypeScript](https://www.typescriptlang.org/) is a typed superset of JavaScript
that compiles to plain JavaScript.

One of the biggest challenges with developing in JavaScript is that it is
very easy to write code that has runtime errors. TypeScript enables the fast
development of JavaScript with optional types. When types are used,
supported editors provide auto-suggest for methods and properties along
with syntax highlighting of errors, which speeds development.

TypeScript supports targeting different browsers, and optimizes
the resulting JavaScript. It is much easier to write clean, consistent code
across a project and development team.  TypeScript offers support for the
latest and evolving JavaScript features like async functions and decorators,
to help build robust components.

For a nice intro to TypeScript, check out the [TypeScript PlayGround](https://www.typescriptlang.org/play/index.html).

# Instructions

## Prerequisites

1. The latest copy of the `firebase-tools`.
2. The latest version of `firebase-admin` and `firebase-functions`

## Setup

1. Clone this repo.
2. Set `firebase-tools` to use your project with `firebase use <YOUR_PROJECT>`
3. Move inside your `functions\` folder
3. Update your dependencies with `npm install`
4. Deploy your functions with `npm run deploy`


Note: with TypeScript you need to build the JavaScript files before
deploying, so there's an npm script that does the steps.  You can see
that and a few other handy shortcuts in [package.json](functions/package.json)
