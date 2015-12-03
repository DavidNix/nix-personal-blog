+++
date = "2015-12-03T06:59:45-07:00"
title = "Stop Using NSNotificationCenter"
tags = ["ios", "opinion", "anti-pattern"]
description = "Don’t use NSNotifcationCenter. Most of the time it's a HUGE mistake. It's okay to use the center to respond to iOS driven events, like UIKeyboardDidShow Notification. But don't use it to wire up message passing in your own code"
+++

Don’t use
[NSNotifcationCenter](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/NSNotificationCenter_Class/)!

Most of the time it's a HUGE mistake.

It's okay to use the center to respond to iOS driven events, like
`UIKeyboardDidShowNotification`. But don't use it to wire up message passing in
your own code. 

Don't do it.

I have a knack for inheriting codebases written by less experienced iOS
developers.  What’s the number one mistake I see?  Abuse of
`NSNotificationCenter.defaultCenter()`. Notifications fly around like feces in a chimpanzee
exhibit.

That's how you should view NSNotifications, as crap flying around your
codebase.  I'll explain why and give alternatives in a bit. And I'll
show you when it's appropriate to use `NSNotificationCenter`.

So this article is dedicated to you, fresh-off-the-boat iOS developers. I'm
secretly hoping for some karma and the next codebase I inherit isn't a tangled
mess of notifications.

## Observe, if you will

`NSNotifcationCenter` is a type of [Observer design
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

`NSNotificationCenter` is a little different. Observers register with the center
instead of the Subject. Then, any object can post notifications to the center. If
a notification matches, an Observer fires. This is a publish/subscribe or
message bus pattern. But I argue it's still a flavor of the Observer pattern.

Observer creates decoupled code which everyone says is a good thing. 

But there is too much of a good thing.

## The #1 reason to avoid NSNotificationCenter

**Flow of control is difficult to follow.**

Any part of the codebase can register an Observer. Any object in the codebase
can post notifications.  It's like piecing together distant dots.
Control+Command+f becomes your only tool. A poor tool at that.

As the original author, it's easy for you to connect the dots.  Your project
may never have another developer except you. But still, reading code you wrote
weeks ago might as well have been written by another person. Save your future
self a headache and do something other than fire off notifications.

Also, it doesn't help Apple often uses `NSNotificationCenter` in the Cocoa
frameworks. In fact, use this
[gist](https://gist.github.com/DavidNix/9596c2083380b50931e3) to see all
notifications flying around.  It's staggering. So, if you're realizing you
often use `NSNotification`s, it's not your fault. Apple and beginner iOS books
have deceived you.

It's not your fault.

# Alternatives

The following is a list of alternative patterns.  Notice `NSNotificationCenter`
is the last option.  It should be your last resort!

For example, let's say you have a `User` object with a `fullName` and
`profileImage` as properties (aka public instance variables). You also have a
view that shows the user's full name in a `UILabel` and the profile image in a
`UIImageView`. You want to update the view as the user edits their profile by
changing their name or profile image.

Note: All examples are Swift.

```swift
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

Additionally, there may be many views interested in the state of a
user. You could add another argument to `User.init(...)` but that gets unwieldy
fast. Not to mention, you must have every view available when you create a
`User`, which may not be the case.

Although bad code, it demonstrates good flow of control. It's easy to trace
cause and effect when you change a property on a user.

Also notice `User` and `UserProfileView` are tightly coupled. If one changes it
may cause the other one to change.  That's usually bad, but not always.  

It's only bad if the coupled objects change often. Let's say a `User` has
settings. A user can have one and only one `Settings` object. Tight coupling in
this case might be okay. There may be little reason `Settings` needs further
abstraction. The rest of the system can depend on the concrete type. But of
course, it all depends on your application.

If you need further abstraction, look to the next pattern:

### 1. The Delegate Pattern

The Delegate pattern is one of my favorites in mobile development.  Apple uses
this pattern everywhere and with good reason. It's a great way to break
dependencies and rely on **behavior** instead of concrete types.

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

And we refactor `UserProfileView` to implement `UserDelegate`:

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
// In a UserTest.swift file
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

// In a separate UserProfileViewTest.swift file
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

Notice, I created a `TestDelegate` to test that `User` calls the delegate
method. I did not use an instance of `UserProfileView` even though I still
could have written the test with it. `User` doesn't care at all what the
delegate does after `User` informs the delegate of its changes. This makes your
unit tests less brittle. Now, if `UserProfileView` changes its behavior, `User`
tests won't fail. 

Limiting chain reactions is the name of the game. If you change behavior in one
section of code and unrelated tests fail, that's a sign you need to
break dependencies.

The Delegate Pattern breaks dependencies but doesn't obscure flow of control.
In this case, trace back to the when `User` is created.  Then see how the
delegate implements the protocol methods.

Guess what? We're still using dependency injection. Instead of injecting a
concrete type, we inject any type that conforms to the protocol.

This is also valid injection.

```swift
class User {
    // refactor let to var   
    var delegate: UserDelegate?
}

let user = User()
user.delegate = UserProfileView(frame: ...)
```

We inject the `UserDelegate` by assignment instead of initialization.

I use the delegate pattern all the time. In this example, it's still not a
great choice. Why? Only one object can be a `User`'s delegate. We'll may have
many views that want to update based on the state of a `User`.

So our next option is:

### 2. Key-Value Observing

[Key-Value
Observing](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/KeyValueObserving/KeyValueObserving.html) (KVO)
is more in line with the classic Observer pattern. It's a neat feature from the
Cocoa and Cocoa Touch framework. Unfortunately, the API is old and therefore
a bit odd. But it's a powerful tool if not abused.

Observers register key paths with a Subject to observe changes. A "key path",
in this context, means a property (or public instance variable) on the
Subject.

Use KVO with care. You further obscure flow of control. But, it's a good fit in
a typical Model-View-Controller world when you have many view controllers
that update their state based on changes in a model.

`User` refactors to:

```swift
class User: NSObject {
    dynamic var fullName: String?
    dynamic var profileImage: UIImage?
}
```

To use KVO in Swift, `User` must subclass `NSObject` and observable properites must be
[dynamically
dispatched](https://developer.apple.com/library/mac/documentation/Swift/Conceptual/BuildingCocoaApps/InteractingWithObjective-CAPIs.html#//apple_ref/doc/uid/TP40014216-CH4-ID57).

The Observer, `UserProfileView`, becomes:

```swift
class UserProfileView: UIView {
    var nameLabel: UILabel
    var imageView: UIImageView
    
    private var userContext = 0
    private var user: User?
    
    convenience init(frame: CGRect, user: User) {
        self.init(frame: frame)
        self.user = user
        self.user?.addObserver(self, forKeyPath: "fullName", options: .New, context: &userContext)
        self.user?.addObserver(self, forKeyPath: "profileImage", options: .New, context: &userContext)
    }
    
    deinit {
        self.user?.removeObserver(self, forKeyPath: "fullName")
        self.user?.removeObserver(self, forKeyPath: "profileImage")
    }
    
    override func observeValueForKeyPath(keyPath: String?, ofObject object: AnyObject?, change: [String : AnyObject]?, context: UnsafeMutablePointer<Void>) {
        if keyPath == "fullName" {
            if let newFullName = change?[NSKeyValueChangeNewKey] as? String {
               nameLabel.text = newFullName
            }
        }
        
        if keyPath == "profileImage" {
            if let newProfileImage = change?[NSKeyValueChangeNewKey] as? UIImage {
                imageView.image = newProfileImage
            }
        }
    }

    required init?(coder aDecoder: NSCoder) {
        // ...
    }
}
```

As you can see, KVO is laborous.  And, you must remove observers, typically on
`deinit`. If you don't, your app crashes if the Subject hangs around longer
than the Observer. Much like registering observers with `NSNotificationCenter`,
you have to remove the observer at some point. If you forget, BOOM!

Tests become:

```swift
func test_KVO() {
    let user = User()
    let profileImageView = UserProfileView(frame: CGRectZero, user: user)
    
    user.fullName = "Luke Skywalker"
    XCTAssertEqual(profileImageView.nameLabel.text, "Luke Skywalker")
    
    let image = UIImage()
    user.profileImage = image
    XCTAssertEqual(profileImageView.imageView.image, image)
}
```

### 3. The NSNotificationCenter

You know what? I'm not going to show code samples here. In our `User` and
`UserProfileView` example, you should have stopped with KVO. I don't want to
give you any bad habits.

Unit testing notifications is a pain too. You have to 1) test that something
posted the `NSNotification` at the appropriate time and 2) test the Observer
responds to the notification.

Pro Tip: Don't use `defaultCenter()` in your unit test suite. Inject a new
`NSNotificationCenter` into each class that needs it. Then write your tests
against that unique instance. I'll leave that as an exercise for you, dear
reader. In your production code, inject the `defaultCenter()`.

Like KVO, if you forget to unregister observers, the app crashes. I've found
using the `defaultCenter()` in a test suite causes all sorts of crashes even
though you unregister at the right times. Unit tests create and destroy a ton
of objects.  So, it's easy for Mr. DefaultCenter to get out of sync.

## When to Use NSNotificationCenter

Ask yourself one question:

**Does my entire app need to know about this event?**

If you answer "no", then don't use the `NSNotificationCenter`. 

An example of proper usage are `UIKeyboardDidShowNotification` and
related.  The keyboard appearing affects the entire app. It gives your UI a
chance to change itself in case the keyboard hides critical views or controls.
Apple can't assume your view hierarchy, so it's your job to respond to
the notification and change your UI.

In my experience, I often fire off `UserDidSignInNotification` and
`UserDidSignOutNotification`. In a typical app, there's state that needs to be
set up on sign in or torn down on sign out. Deleting cached data and what not.
It's an app wide event. Also, deep within my network layer, if the server
reponds with 401 or 403, I need to sign out that user. The network layer
doesn't care about view state, so firing off a `UserDidSignOutNotification`
works well.

**Bonus question: When should I use the Observer pattern?**

Consider it when you have more than one object interested in changes of
another shared object. I often use it when many view controllers need to
update state from one shared model. This respresents a one-to-many
relationship.  One Subject and many observers. Although in practice, I rarely
need to bind many Observers to one Subject.

What's more common in iOS are one-to-one relationships. Only one object is
interested in changes from a Subject. One-to-one relationshps are much easier
to manage.  Prefer them over one-to-many. For one-to-one bindings, I use the
Delegate Pattern.

## Conclusion

`NSNotificationCenter` is an
[anti-pattern](https://en.wikipedia.org/wiki/Anti-pattern) most of the time.
Notifications make it difficult to trace flow of control.

Instead of posting and responding to notifications, try:

* Injecting a concrete type
* Using the Delegate Pattern
* Then maybe Key-Value Observing

The above is a non-exhaustive list of alternatives. I'd love to hear what
others have done to mitigate using the `NSNotificationCenter`.

## Additional Resources
* https://objcsharp.wordpress.com/2013/08/28/why-nsnotificationcenter-is-bad/
* https://developer.apple.com/videos/play/wwdc2015-408/
