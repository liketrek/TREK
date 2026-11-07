# Adds an extension target (or the watch app) to App.xcodeproj and embeds it.
#
#   ruby ios/scripts/add-extension.rb <name> <bundle-id> <type> [options] [extra frameworks...]
#
# type is "notification" (Notification Service Extension), "widget" (WidgetKit,
# which also carries the Live Activities), "share" (the share sheet entry),
# "watch" (the Apple Watch app, embedded in the phone app's Watch folder) or
# "watchwidget" (the watch's complications, embedded in the watch app). The
# target's sources live in ios/App/<name>/ with an Info.plist and
# <name>.entitlements next to them; an asset catalog there is a resource. The
# project file stays checked in, so the targets show in Xcode like any other;
# this script is how they got there, and running it again changes nothing.
#
# Options:
#   --with=<path>,...       more sources under ios/App compiled into the target
#                           too, each a folder of .swift files or one file
#                           (code shared between targets keeps one reference)
#   --host=<target>         the target a watchwidget is embedded in
#   --app-file=<path>,...   sources added to the phone app itself: the phone's end
#                           of what the new target talks to
#   --strings-from=<name>   the target uses the Localizable.strings of that folder
require 'xcodeproj'

name, bundle_id, type, *rest = ARGV
types = %w[notification widget share watch watchwidget]
abort "usage: add-extension.rb <name> <bundle-id> <#{types.join('|')}> [options] [frameworks...]" unless name && bundle_id && types.include?(type)
options, frameworks = rest.partition { |arg| arg.start_with?('--') }
option = ->(key) { options.find { |o| o.start_with?("--#{key}=") }&.split('=', 2)&.last }
list = ->(key) { (option.(key) || '').split(',').reject(&:empty?) }
watch = %w[watch watchwidget].include?(type)
app_dir = File.expand_path('../App', __dir__)

project_path = File.join(app_dir, 'App.xcodeproj')
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'

if project.targets.any? { |t| t.name == name }
  puts "#{name} is already in the project"
  exit 0
end

target = if type == 'watch'
           project.new_target(:application, name, :watchos, '11.0', nil, :swift)
         else
           project.new_target(:app_extension, name, watch ? :watchos : :ios, watch ? '11.0' : '15.0', nil, :swift)
         end
# new_target links Foundation by a path into one SDK version; it is linked
# implicitly anyway, and a pinned SDK path breaks on the next Xcode.
target.frameworks_build_phase.files.select { |f| f.display_name.to_s.include?('Foundation') }.each do |f|
  ref = f.file_ref
  f.remove_from_project
  ref&.remove_from_project
end

group = project.main_group.find_subpath(name, true)
group.set_source_tree('<group>')
group.set_path(name)
sources = Dir.children(File.join(app_dir, name)).sort
# Localizations go in as one variant group, so Xcode copies each language's
# strings into the extension bundle; JavaScript (Safari's page preprocessing) and
# an asset catalog are resources as well.
lprojs, files = sources.partition { |file| file.end_with?('.lproj') }
files.each do |file|
  ref = group.new_reference(file)
  target.add_file_references([ref]) if file.end_with?('.swift')
  target.add_resources([ref]) if file.end_with?('.js', '.xcassets')
end
unless lprojs.empty?
  variant = group.new_variant_group('Localizable.strings')
  lprojs.each do |dir|
    lang = dir.delete_suffix('.lproj')
    ref = variant.new_reference("#{dir}/Localizable.strings")
    ref.name = lang
    ref.last_known_file_type = 'text.plist.strings'
    project.root_object.known_regions |= [lang]
  end
  target.add_resources([variant])
end

# A file already in the project (the widgets' style, shared with the watch)
# keeps its one reference; one new to it goes in a group named after its folder.
reference_for = lambda do |relative|
  full = File.join(app_dir, relative)
  project.files.find { |f| f.real_path.to_s == full } || begin
    dir = File.dirname(relative)
    parent = project.main_group
    unless dir == '.'
      parent = project.main_group.find_subpath(dir, true)
      parent.set_source_tree('<group>')
      parent.set_path(dir)
    end
    parent.new_reference(File.basename(relative))
  end
end

list.('with').each do |entry|
  folder = File.join(app_dir, entry)
  paths = File.directory?(folder) ? Dir.children(folder).sort.select { |f| f.end_with?('.swift') }.map { |f| "#{entry}/#{f}" } : [entry]
  target.add_file_references(paths.map { |path| reference_for.(path) })
end

list.('app-file').each do |path|
  ref = reference_for.(path)
  app.add_file_references([ref]) unless app.source_build_phase.files_references.include?(ref)
end

if (strings_from = option.('strings-from'))
  variant = project.main_group.find_subpath(strings_from, false)&.children&.find { |c| c.isa == 'PBXVariantGroup' && c.name == 'Localizable.strings' }
  abort "no Localizable.strings in #{strings_from}" unless variant
  target.add_resources([variant])
end

frameworks.each do |framework|
  ref = project.frameworks_group.new_file("System/Library/Frameworks/#{framework}.framework", :sdk_root)
  target.frameworks_build_phase.add_file_reference(ref, true)
end

app_settings = app.build_configurations.first.build_settings
target.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = "#{name}/Info.plist"
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = "#{name}/#{name}.entitlements"
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['DEVELOPMENT_TEAM'] = app_settings['DEVELOPMENT_TEAM'] if app_settings['DEVELOPMENT_TEAM']
  s['SWIFT_VERSION'] = '5.0'
  s['MARKETING_VERSION'] = app_settings['MARKETING_VERSION'] || '1.0'
  s['CURRENT_PROJECT_VERSION'] = app_settings['CURRENT_PROJECT_VERSION'] || '1'
  s['SKIP_INSTALL'] = 'YES'
  if watch
    s.delete('IPHONEOS_DEPLOYMENT_TARGET')
    s['SDKROOT'] = 'watchos'
    s['TARGETED_DEVICE_FAMILY'] = '4'
    s['WATCHOS_DEPLOYMENT_TARGET'] = '11.0'
    if type == 'watch'
      s['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
      s['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
      s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
    else
      s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
    end
  else
    s['TARGETED_DEVICE_FAMILY'] = '1,2'
    s['IPHONEOS_DEPLOYMENT_TARGET'] = type == 'widget' ? '16.2' : '15.0'
    s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  end
end

# The watch app goes into the phone app's Watch folder, every extension into the
# PlugIns of its host: the phone app, or the watch app for the complications.
if type == 'watch'
  host = app
  embed = app.copy_files_build_phases.find { |p| p.name == 'Embed Watch Content' } ||
          app.new_copy_files_build_phase('Embed Watch Content')
  embed.symbol_dst_subfolder_spec = :products_directory
  embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
else
  host = type == 'watchwidget' ? project.targets.find { |t| t.name == option.('host') } : app
  abort 'a watchwidget needs --host=<watch target>' unless host
  embed = host.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' } ||
          host.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
end
build_file = embed.add_file_reference(target.product_reference, true)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
host.add_dependency(target)

project.save
puts "added #{name} (#{bundle_id})"
