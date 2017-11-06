import {
    AUTHOR_OF_COMMENTS, AUTHOR_OF_LIKES, AUTHOR_OF_POSTS, COMMENTS, EVENTS, FEED, FOLLOWERS, LIKES, MAX_BATCH_SIZE,
    POSTS,
    PRIV_USER_DATA, PUBLIC_USER_DATA
} from "../constants";
import * as _ from "lodash";
import {firestoreInstance} from "../index";


export async function updateFeedAfterUserAction(event, follow: boolean) {
    // noinspection TypeScriptUnresolvedVariable
    const followerId = event.params.followerId;
    // noinspection TypeScriptUnresolvedVariable
    const followedId = event.params.followedId;

    const followerFeedRef = firestoreInstance.collection(PRIV_USER_DATA).doc(followerId).collection(FEED);
    try {
        //Get the posts from the followed user
        const followedUserPosts = await getLastMonthUserPosts(followedId);
        // console.log('User ', followedId, ' have ', followedUserPosts.length, ' posts');
        //Check if the followed user have posts
        if (followedUserPosts.length == 0) {
            return console.log('User ', followedId, ' doesnt have posts');
        }

        //Generate the right amount of batches
        const batches = _.chunk(followedUserPosts, MAX_BATCH_SIZE)
            .map(postSnapshots => {
                const writeBatch = firestoreInstance.batch();
                if (follow) {
                    postSnapshots.forEach(post => {
                        // console.log('Writing ', post.id, ' in feed ', followerId);
                        writeBatch.set(followerFeedRef.doc(post.id), post.data());
                    });
                } else {
                    postSnapshots.forEach(post => {
                        // console.log('Deleting ', post.id, ' in feed ', followerId);
                        writeBatch.delete(followerFeedRef.doc(post.id));
                    });
                }
                return writeBatch.commit();
            });

        await Promise.all(batches);
        console.log('Feed for user ', followerId, ' updated after follow, ', follow, ' user ', followedId)
    } catch (err) {
        console.error('Failed updating the feed of the user ', followerId, 'after follow user ', followerId, 'with error', err);
    }

}

export async function updateFollowersFeed(event, isDeletion: boolean) {
    const postId = event.params.postId;
    const authorId = event.data.data().author.uid;

    const privateUserdataRef = firestoreInstance.collection(PRIV_USER_DATA);
    try {

        //Retrieve the Id's from all the followers of the post author
        const authorFollowers = await getUserFollowersIds(authorId);

        //Check if the user have followers
        if (authorFollowers.length == 0) {
            return console.log('There are no followers to update feed.');
        }

        //Generate the right amount of batches
        const batches = _.chunk(authorFollowers, MAX_BATCH_SIZE)
            .map(userIds => {
                const writeBatch = firestoreInstance.batch();
                if (isDeletion) {
                    userIds.forEach(userId => {
                        // console.log('Deleting post ', postId, ' in user ', userId, ' feed');
                        writeBatch.delete(privateUserdataRef.doc(userId).collection(FEED).doc(postId));
                    });
                } else {
                    userIds.forEach(userId => {
                        // console.log('Writing post ', postId, ' in user ', userId, ' feed');
                        writeBatch.set(privateUserdataRef.doc(userId).collection(FEED).doc(postId), event.data.data());
                    });
                }
                return writeBatch.commit();
            });

        await Promise.all(batches);
        console.log('The feed of ', authorFollowers.length, ' have been update')
    } catch (err) {
        console.error('Failed updating the users feed after the user', authorId, ' posted ', postId, 'with error', err);
    }
}

async function updateAuthorInUserReferences(userId: string, newUsername: string, photoUrl: string) {
    const privateDataReference = firestoreInstance.collection(PRIV_USER_DATA);
    const userFeedReference = privateDataReference.doc(userId).collection(FEED);
    const postReference = firestoreInstance.collection(POSTS);
    const eventReference = firestoreInstance.collection(EVENTS);
    const updateReferences: Array<FirebaseFirestore.DocumentReference> = [];
    const newAuthor = {
        username: newUsername,
        photoUrl: photoUrl,
        uid: userId
    };

    try {
        //Retrieve the user current followers to update all the references of their feeds
        const userFollowers = await getUserFollowersIds(userId);
        //for each follower, retrieve their posts in the feed which author is our user
        userFollowers.forEach(async followerId => {
            const postFeedsFromCurrentUser = await getPostsFromUserFeedFilterByUser(userId, followerId);
            //Add the references to update the post for each user
            Array.prototype.push.apply(updateReferences,
                postFeedsFromCurrentUser.map(post => privateDataReference.doc(followerId).collection(FEED).doc(post.id)))
        });

        //Retrieve the posts created by the user and add them to the referencesMap
        const userPosts = await getUserPostsIds(userId);
        Array.prototype.push.apply(updateReferences,
            userPosts.map(postId => postReference.doc(postId)));
        Array.prototype.push.apply(updateReferences,
            userPosts.map(postId => userFeedReference.doc(postId)));

        //Retrieve the likes done by the user and add them to the referencesMap
        const userLikes = await getUserLikes(userId);
        Array.prototype.push.apply(updateReferences,
            userLikes.map(like => postReference.doc(like.data().postId).collection(LIKES).doc(like.id)));

        //Retrieve the comments of the user and add them to the referencesMap
        const userComments = await getUserComments(userId);
        Array.prototype.push.apply(updateReferences,
            userComments.map(comment => postReference.doc(comment.data().postId).collection(COMMENTS).doc(comment.id)));

        //Retrieve the events made by the user
        const userEvents = await getEventsMadeByUser(userId);
        Array.prototype.push.apply(updateReferences,
            userEvents.map(event => eventReference.doc(event.id)));

        //Generate the right amount of batches
        const batches = _.chunk(updateReferences, MAX_BATCH_SIZE)
            .map(dataRefs => {
                const writeBatch = firestoreInstance.batch();
                dataRefs.forEach(ref => {
                    writeBatch.update(ref, 'author', newAuthor);
                });
                return writeBatch.commit();
            });

        await Promise.all(batches);
        console.log('The author of ', userId, ' have been update in ', updateReferences.length, ' places')
    } catch (err) {
        console.error('There was an error trying to update the references of the user', userId, ' error: ', err)
    }
}

async function getUserPostsIds(userId: string): Promise<string[]> {
    const userPosts = await firestoreInstance.collection(PRIV_USER_DATA).doc(userId).collection(AUTHOR_OF_POSTS).get();
    return userPosts.docs.map(postSnapshot => postSnapshot.id)
}

async function getPostsFromUserFeedFilterByUser(userId: string, filterByAuthorId: string): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    const feedPostsQuery = await firestoreInstance.collection(PRIV_USER_DATA).doc(userId).collection(FEED)
        .where('author.uid', '==', filterByAuthorId).get();
    return feedPostsQuery.docs;
}

async function getUserLikes(userId: string): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    const userLikesQuery = await firestoreInstance.collection(PRIV_USER_DATA).doc(userId).collection(AUTHOR_OF_LIKES).get();
    return userLikesQuery.docs;
}

async function getEventsMadeByUser(userId: string): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    const eventsMadeByUserQuery = await firestoreInstance.collection('PrivateUserData')
        .doc(userId).collection(EVENTS)
        .where('interactionUser', '==', userId).get();
    return eventsMadeByUserQuery.docs;
}

async function getUserComments(userId: string): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    const userCommentsQuery = await firestoreInstance.collection(PRIV_USER_DATA).doc(userId).collection(AUTHOR_OF_COMMENTS).get();
    return userCommentsQuery.docs;
}

async function getUserFollowersIds(userId: string): Promise<string[]> {
    const followers = await firestoreInstance.collection(PUBLIC_USER_DATA).doc(userId).collection(FOLLOWERS).get();
    return followers.docs.map(followerSnapshot => followerSnapshot.id)
}

async function getLastMonthUserPosts(userId: string): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    const today = new Date();
    const priorDateTimeStamp = new Date().setDate(today.getDate() - 30);
    const priorDate = new Date(priorDateTimeStamp);

    const userPostsQuery = await firestoreInstance.collection(PRIV_USER_DATA).doc(userId).collection(AUTHOR_OF_POSTS)
        .where('creationDate', '>=', priorDate)
        .get();

    return userPostsQuery.docs;
}