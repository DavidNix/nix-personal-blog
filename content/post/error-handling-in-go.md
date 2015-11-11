+++
date = "2015-11-10T21:47:04-07:00"
title = "Go's Error Handling is Elegant"
tags = ["Go"]
+++

I'm writing in response to [this
article](http://spaces-vs-tabs.com/4-weeks-of-golang-the-good-the-bad-and-the-ugly/).
Specifically, the section titled "The Ugly" featuring error handling.

New programmers to Go often critique Go's error handling.  Notice I didn't say
*exception* handling.  Go doesn't have exceptions, although you can sort of
emulate it with [panic and
recover](http://blog.golang.org/defer-panic-and-recover).  But I highly
recommend against it.  It's an anti-pattern if used too often.  Go has a
simpler way of handling when something goes wrong in your program.

The Go authors put a lot of thought into error handling.  I feel they came up
with one of the better solutions out there.  It's simple and elegant.

As a refresher, Go allows multiple return values.  By convention, if something
can go wrong, a function returns an error as its last return value.

```go
func ETPhoneHome(msg string) (string, error) {
    // implementation
}
```

An `error` type is just:

```go
type error interface {
    Error() string
}
```

This means **any** type that implements a method called `Error()` returning a
`string` satisfies the `error` interface. The string returned should describe
what went wrong. Check out Go's
[interfaces](https://golang.org/doc/effective_go.html#interfaces) if you're
confused.

In a lot of sample Go code, you see:

```go
response, err := ETPhoneHome("I can't fly this bike forever!")
if err != nil {
    // handle the error, often:
    return err
}
// do something with response
```

A lot of programmers have beef with this seemingly constant nil checking:

```go
if err != nil {
    // handle the error
}
```

Let's take a break from Go and compare it to other languages.

There's ye olde Java:

```java
// Java
try {
    String response = ET.phoneHome("I hate white lab coats.")
    System.out.println(response);
} catch(Exception e) {
    System.out.println("Exception thrown  :" + e);
}
```

Or shiny new Swift 2:

```swift
// Swift
// Option 1
do {
    let response = try ETPhoneHome("Those are guns not walkie talkies!")
    // process response
} catch (let error as NSError) {
    print("oops", error)
}

// Option 2: assign to an optional variable
let response = try? ETPhoneHome("Halp!")

// Option 3: crash the app if an error is thrown
let response = try! ETPhoneHome("BOOM")
```

So which is simpler? `Do, try, catch` and friends?  Choosing among several
error catching options?  Or just:

```go
// Go
if err != nil {
    // handle the error
}
```
But you could argue, only one caller needs the try/catch dance.  Anything
downstream could throw exceptions all the live long day. In practice, that's
rarely the case.  With Swift, I find myself deciding between `do/catch` or
`try?` quite often, especially in unit tests.

Interpreted languages, like Ruby, are more concise because you aren't required
to handle exceptions at all.  Swift and Java won't compile until you force the
caller to handle the exception.  Go won't compile unless the caller handles or
ignores the error value.

With Ruby, you just have to *know* that a method might raise an exception.
Rails uses a bang in the method name (ex: `model.save!`) to show that some sort
of exception may be raised.  But otherwise, good luck trying to find when,
where, or what. Therefore, it's more common in interpreted languages to see
exceptions at runtime. Go (along with Swift and Java) try to tell you about all
error cases up front to limit unexpected behavior at runtime.

The Go authors argue that not all exceptions are exceptional.  Not all errors
should crash your app. I agree.  If you can gracefully recover from an error,
you should do so.  Your app will be stable and robust.  Of course, easier said
than done.  It takes more effort on the programmer's part. In Ruby you can
pinky swear an exception will never happen and move on. That is, until a
customer calls you complaining about your app not working.

## Errors are Values

The Go team purposefully chose errors to be values.

> Values can be programmed, and since errors are values, errors can be programmed.
Errors are not like exceptions.  There's nothing special about them, whereas an
unhandled exception can crash your program.

The above is from https://blog.golang.org/errors-are-values by Rob Pike. Do
yourself a huge favor and read Pike's blog post next.

In Go, functions pass errors around just like any other type.  Because indeed
they are just a type.  

Exceptions, on the other hand, are unique.  They can wreak havoc on your
program if left unchecked.  (I realize there are technical differences between
Swift errors and exceptions. But the semantics are the same in regards to error
handling.)

So, if we can handle errors using simple values, why do we need this special
exception stuff?  Why not leave that complexity out of the language?

I'm not sure if the Go authors reached that exact conclusion, but it make sense
to me.

## Flow of Control

Rob Pike also writes:

> Error handling [in Go] does not obscure the flow of control.

Since an `error` in Go must either be 1) handled/ignored right then and there or 2)
returned to the caller.  You can track the path of the `error`.

The flow of control is less clear in other languages.  Take Swift:

```swift
// Swift
do {
    // If successful, the happy path is now nested.
} catch (let error as NSError) {
    // handle error
}
```

For simple things, it's okay to have that nesting.  But what if there's
additional nesting like `if/else`? It could quickly become hard to read.

Whereas in Go:

```go
// Go
result, err := SomeFunction()
if err != nil {
    // handle the error
}
// happy path proceeds as normal without nesting
```

Swift 2 introduced the `guard` statement to improve flow of control. But you
can only use it like this:

```swift
// Swift
guard let result = try? SomeFunction() else {
    return
}
// result is in scope, proceed with happy path
```

So you can't inspect the error using a Swift `guard`. But what if you want to
inspect the error AND avoid the nesting?  You can do this in Swift:

```swift
// Swift
var result: Any?
do {
    result = SomeFunction()
} catch (let error as NSError) {
    // handle error
}
// proceed with happy path
```

So how is the above cleaner than the below?

```go
// Go
result, err := SomeFunction()
if err != nil {
    // handle the error
}
// trot down the happy path
```

In Ruby, raising and catching an exception acts like the dreaded `GOTO`
statement. Ruby code that raises an exception can be arbitrarily deep. The
caller that rescues the exception can be anywhere up the stack. So, rescuing
the exception is like saying "GOTO this random place up the stack".  That's
terrible flow of control. I've spent my fair share of time debugging Ruby code
with errant exceptions.  It's no fun at all and hard to trace.

## Code Your Way Out of It

Just because you can do this

```go
if err != nil {
    // handle the error
}
```

doesn't mean you have to litter it everywhere in your code.  You're free to
code your way out of it. Delegate error handling to a function or an object.
You're a programmer after all.  Write an abstraction!

As a simple example, when I write CLI tools in Go, I usually have a function:

```go
func checkErr(err error) {
    if err != nil {
        fmt.Println("ERROR:", err)
        os.Exit(1)
    }
}
```

In a CLI tool, this works fine.  But, um, don't do that in a web server.

Rob Pike admits helper functions don't always do the trick.  Again, read
https://blog.golang.org/errors-are-values for a great example of Pike coding
his way out of messy error handling.

## Conclusion

I hope I've shown Go's error handling isn't that bad. I even deem it elegant. I
think a lot of programmers new to Go get frustrated because several functions
in the standard library return errors. That means you have to handle them.
Which in turn means you have to spend effort on them. Which in turn means
you're writing rock solid, stable software. That's not a bad deal.
