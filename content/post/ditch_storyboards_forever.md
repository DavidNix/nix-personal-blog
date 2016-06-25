+++
date = "2016-06-27T09:00:00-06:00"
title = "How to Ditch Storyboards and Nibs Forever"
tags = ["ios", "ui"]
description = "It's an ongoing debate between iOS devs. Do I layout my UI with storyboards and nibs or not? I finally found one solution that let me ditch them forever."
+++

It's an ongoing debate between iOS devs. Do I layout my UI with storyboards and
nibs or not? I finally found one solution that let me ditch 
them forever.

Storyboard problems are well documented. They don't work with version control.
They get so bloated that debugging is nearly impossible. The files grow
so huge, you see the beach ball of death every time you open one. Keeping
IBOutlets, IBActions, and cell identifiers in sync with your source files is
tricky. It often leads to runtime exceptions if you rename something.

Until recently, I chose from four options for view layout:

1. Old school frame manipulation with `UIViewAutoResizing` mask (aka Springs
   and Struts)
2. Create `NSLayoutConstraint`s in code
3. Use Storyboards and Nibs
4. iOS 9's NSLayoutAnchor

I always chose option 3. I didn't want to go back to frame arithmetic and
calling `sizeThatFits:` everywhere. I still had to support iOS 8, so #4 was
out.

I've always wanted to be one of those "purests" and write all my UI in code. But
let's face it, Apple's Auto Layout API is verbose and confusing. One method to
do everything.

```objectivec
+ (instancetype)constraintWithItem:(id)view1
                         attribute:(NSLayoutAttribute)attr1
                         relatedBy:(NSLayoutRelation)relation
                            toItem:(id)view2
                         attribute:(NSLayoutAttribute)attr2
                        multiplier:(CGFloat)multiplier
                          constant:(CGFloat)c
```

That's seven method arguments. Seven!

Or you can use Apple's Visual Format language. Stringly typed code anyone? No
thank you.

Allow me to introduce you to [SnapKit](https://github.com/SnapKit/SnapKit). A
game changer for me. Ever since I started using SnapKit, I have yet to create a
new storyboard or nib.

**Disclaimer:** I have nothing to do with SnapKit's development. I'm just a
huge fan.

For a third-party DSL, SnapKit gets everything right. They follow the UNIX
philosophy. They do one thing and do it well - make Auto Layout declarative and
concise. 

Here's a summary of benefits taken directly from their
[website](http://snapkit.io/docs/):  

* Not limited to a subset of Auto Layout. Anything NSLayoutConstraint can do
  SnapKit can also do.
* Better debugging support to help find breaking constraints.
* No crazy operator overloads.
* Not string or dictionary based and you get the strictest compile time checks
  possible.

Other benefits I've found:

* Automatically disables `translatesAutoresizingMaskIntoConstraints`
  for you
* Handles bookkeeping so you can easily update constraints
* One of the best uses of method overloading I've seen

## A Comparison

Let's keep it simple. I want a view that's inset from its parent on each side
by 10 points.

How you would do it with standard UIKit:

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.translatesAutoresizingMaskIntoConstraints = false

let top = NSLayoutConstraint(
    item: view,
    attribute: .Top,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Top,
    multiplier: 1,
    constant: 10
)

let left = NSLayoutConstraint(
    item: view,
    attribute: .Left,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Left,
    multiplier: 1,
    constant: 10
)

let bottom = NSLayoutConstraint(
    item: view,
    attribute: .Bottom,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Bottom,
    multiplier: 1,
    constant: -10
)

let right = NSLayoutConstraint(
    item: view,
    attribute: .Right,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Right,
    multiplier: 1,
    constant: -10
)

parent.addConstraints([top, left, bottom, right])
```

*Painful.* I needed a couple tries to get it right.

Ok, now let's see Visual Format.

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.translatesAutoresizingMaskIntoConstraints = false

let vertical = NSLayoutConstraint.constraintsWithVisualFormat("V:|-10-[view]-10-|", options: [], metrics: nil, views: ["view": view])
let horizontal = NSLayoutConstraint.constraintsWithVisualFormat("H:|-10-[view]-10-|", options: [], metrics: nil, views: ["view": view])

parent.addConstraints(vertical + horizontal)
```

More concise than raw layout constraints, but I caused 2 runtime
exceptions trying to get this right.

And NSLayoutAnchor introduced in iOS 9.

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.translatesAutoresizingMaskIntoConstraints = false
view.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor, constant: 10).active = true
view.topAnchor.constraintEqualToAnchor(view.topAnchor, constant: 10).active = true
view.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor, constant: -10).active = true
view.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor, constant: -10).active = true
```

The above is improvement over visual format, even though it's more verbose.
But, I still have to remember to set
`translatesAutoresizingMaskIntoConstraints` to false, and to set `active =
true`. It's also hard to read. At a glance, all I see is a wall of words.

And finally, SnapKit:

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.snp_makeConstraints { make in
    make.edges.equalTo(EdgeInsets(top: 10, left: 10, bottom: -10, right: -10))
}
```

As you can see, SnapKit uses the [Builder
Pattern](https://en.wikipedia.org/wiki/Builder_pattern) with a clever use of
closures to achieve a concise and readable DSL.

What's great is I don't have to remember
`translatesAutoresizingMaskIntoConstraints`. And SnapKit provides
`snp_updateConstraints`, so you don't have to capture references to your
constraints. (You still can if you want.) 

The declarative syntax is easy to read. Layout in the closure body has the
added benefit of visually separating layout code from other code. I can glance
at the closure's body and get the gist of the view's layout. 

## Caveats

* Snapkit is Swift only. But the authors still maintain their original
  Objective C library, [Masonry](https://github.com/SnapKit/Masonry).
* With watchOS, you have to use Storyboards. Shucks.
* I haven't tried `UIStackView` because I'm still supporting
  iOS 8. `UIStackView` may alleviate some Auto Layout pain.

## What about other Auto Layout DSLs?

I haven't tested other popular libraries like
[Cartography](https://github.com/robb/Cartography) and
[PureLayout](https://github.com/PureLayout/PureLayout). When I stumbled upon
SnapKit, I instantly loved their API and stuck with it.

# Conclusion

Give SnapKit a try and free yourself from Storyboards and Nibs.
