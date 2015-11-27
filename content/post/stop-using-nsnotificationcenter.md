+++
date = "2015-11-30T06:59:45-07:00"
title = "Stop Using NSNotificationCenter"
tags = ["ios", "opinion", "anti-pattern"]
+++

Don’t use
[NSNotifcationCenter](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/NSNotificationCenter_Class/)!

It's ok to use the center to respond to iOS driven events, like
`UIKeyboardDidShowNotification`. But don't use it to wire up message passing in
your own code. I'm begging you.  Don't do it.

I have a knack for inheriting codebases written by less experienced iOS
developers.  What’s the number one mistake I see?  Abuse of
`NSNotificationCenter.defaultCenter()`. Notifications fly around like feces in a chimpanzee
exhibit.

That's how you should view NSNotifications, as crap flying around your
codebase.  I'll explain why and give alternatives in a little bit. And I'll
show you when it's appropriate to use NSNotificationCenter.

So this article is dedicated to you, fresh-off-the-boat iOS developers. I'm
hoping for some karma and the next codebase I inherit isn't a tangled mess of
notifications.

## Observe, if you will

NSNotifcationCenter is a type of [Observer design
pattern](https://en.wikipedia.org/wiki/Observer_pattern).  After
all, the method signatures contain `addObserver` and `removeObserver`.

Observer is a great pattern to solve some types of problems, but it’s easy to
abuse.

Don’t take my word for it.

>Observer is one of those patterns that, once you understand it, you see uses
>for it everywhere.  The indirection is very cool.  You can register observers
>with all kinds of objects rather than wiring those objects to explicitly call
>you.  While this indirection is a useful way to manage dependencies, it can
>easily be taken to extremes.  Overuse of Observer tends to make systems very
>difficult to understand and trace.
>
>~ Robert Martin, *Agile Software Development*, Chapter 24

Observer breaks dependencies. The Subject doesn't have
to know much about its Observers. When the Subject changes, the Subject
notifies its Observers of the change.  The Subject's job is then finished. The
Observers execute code in response to the change.

NSNotificationCenter is a little different. Observers register with the center
instead of a Subject. Then, any object can post notifications to the center. If
a notification matches, an Observer fires. This is a publish/subscribe or
message bus pattern. But I argue it's still a flavor of the Observer pattern.

Observer creates decoupled code which everyone says is a good thing. But there
is such a thing as too much of a good thing.

## The #1 reason to avoid NSNotificationCenter

**Flow of control is difficult to follow.**

Any part of the codebase can register an Observer. Any object in the codebase
can post notifications.  It's like piecing together distant dots.  Ctl+Cmd+F
becomes your only tool. A poor tool at that.

It's easy for you to connect the dots as you're first writing code with
NSNotifications.  Your project may never have another developer except you. But
still, seeing code you wrote weeks or months ago might as well have been
written by another person. Save your future self a headache and do something
other than fire off notifications.

In addition, it doesn't help Apple often uses NSNotificationCenter in the Cocoa and Cocoa Touch
frameworks. In fact, use this [gist](https://gist.github.com/DavidNix/9596c2083380b50931e3) to see all notifications flying around.
It's staggering. So, if you're realizing you often use NSNotifications, it's
not your fault. Apple and beginner iOS books have deceived you.

# Alternatives

The following is a list of alternative patterns in order of tightly coupled to
loosely coupled dependencies. Notice NSNotificationCenter is the last option.
It should be your last resort!

Let's take an example that you have a `User` object with a `fullName` and
`profileImage` as properties (i.e. public instance variables). You also have a
view that shows the user's full name in a `UILabel` and the profile image in a
`UIImageView`. You want to update the view as the user edits their profile by
changing their name or profile image.

```swift
// All examples in Swift
class User {
    var fullName: String?
    var profileImage: UIImage?
}

class UserProfileView: UIView {
    var nameLabel: UILabel
    var imageView: UIImageView
    
    override init(frame: CGRect) {
        imageView = UIImageView(frame: CGRectMake(0, 0, 50, 50))
        nameLabel = UILabel(frame: CGRectMake(50, 0, 100, 50))
        super.init(frame: frame)
        self.addSubview(profileView)
        self.addSubview(nameLabel)
    }

    required init?(coder aDecoder: NSCoder) {
        // ...
    }
}
```

### 0. Classic Dependency Injection

First, we'll try classic [dependency
injection](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html). 

To use James Shore's wise words:  

> Dependency injection means giving an object its instance variables. Really. That's it.

**Disclaimer:** The following is bad code. For demonstration purposes only.

Let's "inject" the `User` with a dependency:

```swift
class User {
    var fullName: String?
    var profileImage: UIImage?
    
    let profileView: UserProfileView
    
    init(profileView: UserProfileView) {
        self.profileView = profileView
    }
}
```

Now we update the view when the user's properties change.

```swift
class User {
    var fullName: String? {
        didSet {
            profileView.nameLabel.text = fullName
        }
    }
    
    var profileImage: UIImage? {
        didSet {
            profileView.imageView.image = profileImage
        }
    }
    
    let profileView: UserProfileView
    
    init(profileView: UserProfileView) {
        self.profileView = profileView
    }
}
```

And that, dear readers, is dependency injection. To quote Mr. Shore again, it
really is a 25 dollar term for a 5 cent concept. 

`User` becomes easy to unit test too.

```swift
func test_userProperties() {
    let profileView = UserProfileView(frame: CGRectZero)
    let user = User(profileView: profileView)
    
    user.fullName = "Han Solo"
    XCTAssertEqual(profileView.nameLabel.text, "Han Solo")
    
    let image = UIImage()
    user.profileImage = image
    XCTAssertEqual(profileView.imageView.image, image)
}
```

Why is this bad code?

For one, we are violating [clean
architecture](https://blog.8thlight.com/uncle-bob/2012/08/13/the-clean-architecture.html).
But that's beyond the scope of this article.

Additionally, there are probably multiple views interested in
the state of a user. You could add another argument to
`User.init(...)` but that gets unwieldy fast. And you must have
every view available when you create a `User`.

Although it's bad code, it demonstrates the ease of flow of
control. You can easily trace cause and effect when you change a property
on a user.

Notice `User` and `UserProfileView` are tightly coupled. If one changes it
may cause the other one to change.  That's usually bad, but not always.  

It's only bad if the coupled objects change frequently. Let's say a `User` has
settings. A user can have one and only one `Settings` object. Tight coupling in
this case is probably ok. There's little reason `Settings` needs further
abstraction. The rest of the system can depend on the concrete type.

Speaking of abstraction, that brings me to:

### 1. The Delegate Pattern

The Delegate pattern is one of my favorites in mobile development.  Apple uses
this pattern everywhere and with good reason. It's a great way to break
dependencies and rely on **behavior** instead of specific types.

Let's define a protocol:

```swift
protocol UserDelegate {
    func userDidChange(user: User)
}
```

Now, instead of injecting a specific type into `User`, we say it can be
any type that implements the `UserDelegate` protocol. So `User`
refactors to:

```swift
class User {
    var fullName: String? {
        didSet {
            delegate?.userDidChange(self)
        }
    }
    
    var profileImage: UIImage? {
        didSet {
            delegate?.userDidChange(self)
        }
    }
    
    let delegate: UserDelegate?
    
    init(delegate: UserDelegate?) {
        self.delegate = delegate
    }
}
```

And We refactor `UserProfileView` to implement `UserDelegate`:

```swift
class UserProfileView: UIView, UserDelegate {
    var nameLabel: UILabel
    var imageView: UIImageView
    
    override init(frame: CGRect) {
        // init instance variables
    }
    
    func userDidChange(user: User) {
        nameLabel.text = user.fullName
        imageView.image = user.profileImage
    }
}
```

*(Side Note: It's odd that a UIView is implementing the delegate method. Views
should only worry about display and layout. Any manipulation is the
job of a view controller. Ideally, we'd refactor `UserProfileView` into a
`UIViewController` but we won't now for brevity's sake.)*

We have more testing but it's still painless:

```swift
class TestDelegate: UserDelegate {
    var lastUserChanged: User?
    
    func userDidChange(user: User) {
        lastUserChanged = user
    }
}

func test_userProperties() {
    let delegate = TestDelegate()
    let user = User(delegate: delegate)
    
    user.fullName = "Chewbacca"
    XCTAssertEqual(delegate.lastUserChanged, user)
    
    delegate.lastUserChanged = nil
    
    user.profileImage = UIImage()
    XCTAssertEqual(delegate.lastUserChanged, user)
}

func test_userDidChange() {
    let user = User(delegate: nil)
    user.fullName = "C3PO"
    let image = UIImage()
    user.profileImage = image
    
    let profileView = UserProfileView(frame: CGRectZero)
    profileView.userDidChange(user)
    
    XCTAssertEqual(profileView.nameLabel.text, "C3PO")
    XCTAssertEqual(profileView.imageView.image, image)
}
```

Notice, I created a `TestDelegate` to test that `User` calls methods on the
delegate appropriately. I did not use an instance of `UserProfileView` even
though I still could have written the test with it. `User` doesn't care at all
what the delegate does after `User` informs the delegate of its changes.

This separation breaks dependencies, but still doesn't obscure flow of control.
All you have to do, in this case, is trace back to the when the user is
created.  Then see how the delegate implements the protocol methods if, say,
you're debugging something.

Guess what? We're still using dependency injection. This is also valid injection.

```swift
class User {
    // refactor let to var   
    var delegate: UserDelegate?
}

let user = User()
user.delegate = UserProfileView(frame: ...)
```

We injecting the `UserDelegate` by assignment instead of on initialization.

## When to Use NSNotificationCenter

Ask yourself one question:

*Does my entire app need to know about this event?*

If you answer "no", then don't use the NSNotificationCenter. 

A good example usage of NSNotifications is `UIKeyboardDidShowNotification` and
related.  The keyboard appearing affects the entire app. It gives your UI a
chance to change itself in case the keyboard hides critical views or controls.
Apple can't assume what views you have showing, so it's your job to respond to
keyboard notifications and modify your UI appropriately.

In my experience, I've found it effective to fire off
`UserDidSignInNotification` and `UserDidSignOutNotification`. In a typical app,
there can be a lot of state that needs to be set up on sign in or torn down on
sign out. Deleting cached data and what not.  It's an app wide event. I often
find that deep within my network layer, if the server ever gives me a 401 or 403, I
need to sign out that user. The network layer should know nothing about view
state, so firing off a `UserDidSigOutNotification` or similar is effective.

## Conclusion

NSNotificationCenter is an
[anti-pattern](https://en.wikipedia.org/wiki/Anti-pattern) most of the time.

## Additional Resources
* https://objcsharp.wordpress.com/2013/08/28/why-nsnotificationcenter-is-bad/
* https://developer.apple.com/videos/play/wwdc2015-408/
