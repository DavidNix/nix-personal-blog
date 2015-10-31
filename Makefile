.PHONY: deploy

default: deploy

deploy:
	hugo
	git commit -am "RELEASE `date`"
	git push origin develop
	git subtree push --prefix=public origin master	
